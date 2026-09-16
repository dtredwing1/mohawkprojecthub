import { NextRequest, NextResponse } from 'next/server';
import { getDeliverables, createDeliverable, logActivity } from '@/lib/storage';
import { sendSlackNotification } from '@/lib/slack';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') || undefined;
  const deliverables = await getDeliverables(projectId);
  return NextResponse.json(deliverables);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const deliverable = await createDeliverable({
      ...body,
      authorType: body.authorType || 'user',
    });

    await logActivity({
      projectId: deliverable.projectId,
      actor: { name: body.author || 'Team Member', type: body.authorType || 'user' },
      action: 'Linked Deliverable Asset',
      details: `Added "${deliverable.title}" [${deliverable.type}]`,
      category: 'deliverable',
      link: '/deliverables',
    });

    await sendSlackNotification({
      title: 'New Deliverable Added',
      message: `*${deliverable.title}*\n${deliverable.summary}`,
      category: 'deliverable',
      actorName: deliverable.author,
      actorType: deliverable.authorType,
      url: deliverable.driveUrl,
    });

    return NextResponse.json(deliverable, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
