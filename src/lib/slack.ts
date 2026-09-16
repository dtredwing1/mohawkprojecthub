export interface SlackMessagePayload {
  title: string;
  message: string;
  category?: 'item' | 'adr' | 'deliverable' | 'strategy' | 'agent';
  url?: string;
  fields?: { label: string; value: string }[];
  actorName?: string;
  actorType?: 'user' | 'agent' | 'system';
}

export async function sendSlackNotification(payload: SlackMessagePayload): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    // Slack webhook not configured - no-op gracefully
    return { success: true };
  }

  const actorIcon = payload.actorType === 'agent' ? '🤖' : '👤';
  const categoryBadge = payload.category ? `[${payload.category.toUpperCase()}]` : '[HUB]';

  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${actorIcon} ${categoryBadge} ${payload.title}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${payload.actorName || 'Hub Activity'}*: ${payload.message}${payload.url ? `\n🔗 <${payload.url}|View in Project Hub>` : ''}`,
      },
    },
  ];

  if (payload.fields && payload.fields.length > 0) {
    blocks.push({
      type: 'section',
      fields: payload.fields.slice(0, 10).map(f => ({
        type: 'mrkdwn',
        text: `*${f.label}:*\n${f.value}`,
      })),
    });
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Slack webhook failed:', res.status, errText);
      return { success: false, error: errText };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Error dispatching Slack webhook:', err);
    return { success: false, error: err.message };
  }
}
