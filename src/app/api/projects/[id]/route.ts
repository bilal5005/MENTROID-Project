import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await context.params;
    const projectId = resolvedParams.id;

    const body = await req.json();
    const { title, description, projectUrl, status, priority } = body;

    const existing = await prisma.project.findFirst({
      where: { id: projectId, tenantId: session.tenantId }
    });

    if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        title: title ?? existing.title,
        description: description ?? existing.description,
        projectUrl: projectUrl !== undefined ? projectUrl : existing.projectUrl,
        status: status ?? existing.status,
        priority: priority ?? existing.priority,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT_PROJECT_ERROR:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only workspace admins can delete projects' },
        { status: 403 }
      )
    }

    const resolvedParams = await context.params
    const projectId = resolvedParams.id

    const project = await prisma.project.findUnique({
      where: {
        id: projectId
      }
    })

    if (!project || project.tenantId !== session.tenantId) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    await prisma.project.delete({
      where: {
        id: projectId
      }
    })

    return NextResponse.json(
      { message: 'Project deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
