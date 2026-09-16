import { NextRequest, NextResponse } from 'next/server';
import { getStrategy, updateStrategy, logActivity } from '@/lib/storage';
import { sendSlackNotification } from '@/lib/slack';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') || 'proj-mohawk';
  const strategy = await getStrategy(projectId);
  return NextResponse.json(strategy);
}

export async function PUT(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId') || 'proj-mohawk';
    const body = await req.json();
    const updated = await updateStrategy(body, projectId);

    await logActivity({
      projectId,
      actor: { name: body.updatedBy || 'Team Lead', type: 'user' },
      action: 'Updated Strategy & Brand Canvas',
      details: 'Modified strategic pillars or brand guidelines.',
      category: 'strategy',
      link: '/strategy',
    });

    await sendSlackNotification({
      title: 'Strategy Canvas Updated',
      message: 'Strategic pillars and brand guidelines have been updated.',
      category: 'strategy',
      actorName: body.updatedBy || 'Team Lead',
      actorType: 'user',
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
