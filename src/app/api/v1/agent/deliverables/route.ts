import { NextRequest, NextResponse } from 'next/server';
import { validateAgentApiKey } from '@/lib/agent-auth';
import { createDeliverable, logActivity } from '@/lib/storage';
import { sendSlackNotification } from '@/lib/slack';
import { DeliverableType } from '@/lib/types';

export async function POST(req: NextRequest) {
  const auth = validateAgentApiKey(req);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      summary,
      type = 'agent-report' as DeliverableType,
      driveUrl,
      driveFileId,
      author = 'AI Partner',
      tags = [],
      markdownContent,
      linkedItemId,
    } = body;

    if (!title || !summary) {
      return NextResponse.json({ error: 'Title and summary are required.' }, { status: 400 });
    }

    const deliverable = await createDeliverable({
      title,
      summary,
      type,
      driveUrl,
      driveFileId,
      author,
      authorType: 'agent',
      tags,
      markdownContent,
      linkedItemId,
    });

    await logActivity({
      actor: { name: author, type: 'agent' },
      action: 'Published Deliverable via Agent API',
      details: `Published "${deliverable.title}" (${deliverable.type})`,
      category: 'deliverable',
      link: '/deliverables',
    });

    await sendSlackNotification({
      title: 'New Deliverable Published by AI Agent',
      message: `*${deliverable.title}*\n${deliverable.summary}`,
      category: 'deliverable',
      actorName: author,
      actorType: 'agent',
      url: driveUrl || undefined,
      fields: [
        { label: 'Type', value: deliverable.type },
        { label: 'Tags', value: deliverable.tags.join(', ') || 'None' },
      ],
    });

    return NextResponse.json({ success: true, deliverable }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
