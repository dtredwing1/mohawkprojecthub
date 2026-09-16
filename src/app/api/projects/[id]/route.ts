import { NextRequest, NextResponse } from 'next/server';
import { getProject, updateProject, deleteProject, logActivity } from '@/lib/storage';
import { sendSlackNotification } from '@/lib/slack';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateProject(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await deleteProject(id);

    await logActivity({
      projectId: 'proj-mohawk',
      actor: { name: 'Team Lead', type: 'user' },
      action: 'Deleted Project Workspace',
      details: `Deleted workspace "${project.name}" [Key: ${project.key}]`,
      category: 'system',
      link: '/',
    });

    await sendSlackNotification({
      title: 'Project Workspace Deleted 🗑️',
      message: `Workspace *${project.name}* [${project.key}] was deleted.`,
      category: 'system',
      fields: [
        { label: 'Project Key', value: project.key },
        { label: 'Workspace', value: project.name },
      ],
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete workspace' }, { status: 400 });
  }
}
