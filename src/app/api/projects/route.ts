import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const projects = await prisma.project.findMany({
      where: {
        tenantId: session.tenantId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(projects, { status: 200 })
  } catch (error) {
    console.error('Fetch projects error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, projectUrl, status, priority } = body

    if (!title || typeof title !== 'string' || title.length < 2) {
      return NextResponse.json(
        { error: 'Title is required and must be at least 2 characters long' },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        title,
        description: description || null,
        projectUrl: projectUrl || null,
        status: status || 'PLANNING',
        priority: priority || 'MEDIUM',
        tenantId: session.tenantId,
        createdById: session.userId
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
