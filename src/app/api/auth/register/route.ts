import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, signJwt } from '@/lib/auth'
import { cookies } from 'next/headers'

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { companyName, email, password } = body

    if (!companyName || !email || !password) {
      return NextResponse.json(
        { error: 'companyName, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    let baseSlug = slugify(companyName)
    let slug = baseSlug
    let counter = 1
    
    while (true) {
      const existingTenant = await prisma.tenant.findUnique({
        where: { slug }
      })
      if (!existingTenant) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const hashedPassword = await hashPassword(password)

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          slug,
        }
      })

      const user = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          role: 'ADMIN',
          tenantId: tenant.id
        }
      })

      return { tenant, user }
    })

    const token = signJwt({
      userId: result.user.id,
      tenantId: result.tenant.id,
      email: result.user.email,
      role: result.user.role
    })

    const cookieStore = await cookies()
    cookieStore.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    })

    return NextResponse.json(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role
        },
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          slug: result.tenant.slug
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
