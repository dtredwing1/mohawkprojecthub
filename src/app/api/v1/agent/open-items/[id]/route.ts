import { NextRequest, NextResponse } from 'next/server';
import { validateAgentApiKey } from '@/lib/agent-auth';
import { updateOpenItem, logActivity } from '@/lib/storage';
import { sendSlackNotification } from '@/lib/slack';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = validateAgentApiKey(req);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateOpenItem(id, body);

    if (!updated) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const agentName = body.agentName || 'AI Agent';

    await logActivity({
      actor: { name: agentName, type: 'agent' },
      action: 'Updated Action Item via Agent API',
      details: `Updated "${updated.title}" -> Status: ${updated.status}`,
      category: 'item',
      link: '/open-items',
    });

    if (body.status === 'done' || body.status === 'blocked') {
      await sendSlackNotification({
        title: `Item Marked ${updated.status.toUpperCase()} by AI Agent`,
        message: `*${updated.title}*\n${updated.description}`,
        category: 'item',
        actorName: agentName,
        actorType: 'agent',
        fields: [
          { label: 'Status', value: updated.status.toUpperCase() },
          { label: 'Owner', value: updated.owner },
        ],
      });
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
