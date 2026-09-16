import { NextRequest, NextResponse } from 'next/server';
import { getProjects, createProject, logActivity } from '@/lib/storage';
import { sendSlackNotification } from '@/lib/slack';

export async function GET() {
  const projects = await getProjects();
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, key, description, accentColor } = body;

    if (!name || !key) {
      return NextResponse.json({ error: 'Project name and key are required' }, { status: 400 });
    }

    const project = await createProject({
      name,
      key: key.toUpperCase().trim(),
      description: description || '',
      accentColor: accentColor || '#0284c7',
    });

    await logActivity({
      projectId: project.id,
      actor: { name: 'Team Lead', type: 'user' },
      action: 'Created New Project Workspace',
      details: `Created workspace "${project.name}" [Key: ${project.key}]`,
      category: 'system',
      link: '/',
    });

    await sendSlackNotification({
      title: 'New Project Workspace Created',
      message: `Project *${project.name}* [${project.key}] has been initialized.`,
      category: 'system',
      fields: [
        { label: 'Project Key', value: project.key },
        { label: 'Description', value: project.description || 'None' },
      ],
    });

    return NextResponse.json(project, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
