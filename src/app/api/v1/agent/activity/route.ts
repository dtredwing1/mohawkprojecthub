import { NextRequest, NextResponse } from 'next/server';
import { validateAgentApiKey } from '@/lib/agent-auth';
import { logActivity } from '@/lib/storage';
import { sendSlackNotification } from '@/lib/slack';

export async function POST(req: NextRequest) {
  const auth = validateAgentApiKey(req);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      agentName = 'AI Agent',
      action,
      details,
      category = 'system',
      link,
      notifySlack = true,
    } = body;

    if (!action || !details) {
      return NextResponse.json({ error: 'Action and details are required' }, { status: 400 });
    }

    const event = await logActivity({
      actor: { name: agentName, type: 'agent' },
      action,
      details,
      category,
      link,
    });

    if (notifySlack) {
      await sendSlackNotification({
        title: `AI Agent Event: ${action}`,
        message: details,
        category: 'agent',
        actorName: agentName,
        actorType: 'agent',
        url: link,
      });
    }

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
