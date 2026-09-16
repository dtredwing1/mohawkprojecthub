import { NextRequest, NextResponse } from 'next/server';
import { setDefaultProject, logActivity } from '@/lib/storage';
import { sendSlackNotification } from '@/lib/slack';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await setDefaultProject(id);

    await logActivity({
      projectId: project.id,
      actor: { name: 'Team Lead', type: 'user' },
      action: 'Promoted Workspace to Default',
      details: `Workspace "${project.name}" [${project.key}] is now the primary default workspace.`,
      category: 'system',
      link: '/',
    });

    await sendSlackNotification({
      title: 'Primary Workspace Updated ⭐',
      message: `Workspace *${project.name}* [${project.key}] was set as the global default workspace.`,
      category: 'system',
      fields: [
        { label: 'Project Key', value: project.key },
        { label: 'Workspace', value: project.name },
      ],
    });

    return NextResponse.json({ success: true, project });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to set default project' }, { status: 400 });
  }
}
