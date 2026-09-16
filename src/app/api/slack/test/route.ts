import { NextResponse } from 'next/server';
import { sendSlackNotification } from '@/lib/slack';

export async function POST(req: Request) {
  const isConfigured = Boolean(process.env.SLACK_WEBHOOK_URL);
  if (!isConfigured) {
    return NextResponse.json(
      { success: false, configured: false, error: 'SLACK_WEBHOOK_URL environment variable is not configured.' },
      { status: 400 }
    );
  }

  try {
    const result = await sendSlackNotification({
      title: 'Slack Webhook Verified',
      message: 'Project Collaboration Hub is actively connected and dispatching real-time updates.',
      category: 'system',
      actorName: 'Hub System Check',
      actorType: 'system',
      fields: [
        { label: 'Environment', value: process.env.NODE_ENV || 'production' },
        { label: 'Status', value: '🟢 Operational' },
      ],
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, configured: true, error: result.error || 'Slack returned an error response.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, configured: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, configured: true, error: err.message || 'Internal error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const isConfigured = Boolean(process.env.SLACK_WEBHOOK_URL);
  return NextResponse.json({ configured: isConfigured });
}
