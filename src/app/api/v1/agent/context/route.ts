import { NextRequest, NextResponse } from 'next/server';
import { validateAgentApiKey } from '@/lib/agent-auth';
import { getStrategy, getADRs, getOpenItems, getDeliverables } from '@/lib/storage';

export async function GET(req: NextRequest) {
  const auth = validateAgentApiKey(req);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const [strategy, adrs, openItems, deliverables] = await Promise.all([
    getStrategy(),
    getADRs(),
    getOpenItems(),
    getDeliverables(),
  ]);

  return NextResponse.json({
    project: {
      mission: strategy.mission,
      vision: strategy.vision,
      pillars: strategy.pillars,
      brandGuidelines: strategy.brandGuidelines,
    },
    activeOpenItems: openItems.filter(i => i.status !== 'done'),
    acceptedDecisions: adrs.filter(a => a.status === 'accepted'),
    latestDeliverables: deliverables.slice(0, 5),
    timestamp: new Date().toISOString(),
  });
}
