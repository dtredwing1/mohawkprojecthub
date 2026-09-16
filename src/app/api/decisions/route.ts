import { NextRequest, NextResponse } from 'next/server';
import { getADRs, createADR, logActivity } from '@/lib/storage';
import { sendSlackNotification } from '@/lib/slack';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') || undefined;
  const adrs = await getADRs(projectId);
  return NextResponse.json(adrs);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const adr = await createADR(body);

    await logActivity({
      projectId: adr.projectId,
      actor: { name: body.author || 'Team Lead', type: 'user' },
      action: 'Created Architecture Decision Record',
      details: `ADR #${adr.number}: "${adr.title}" [Status: ${adr.status}]`,
      category: 'adr',
      link: '/decisions',
    });

    await sendSlackNotification({
      title: `New ADR #${adr.number}: ${adr.title}`,
      message: `*Decision:*\n${adr.decision}\n\n*Context:*\n${adr.context}`,
      category: 'adr',
      actorName: adr.author,
      actorType: 'user',
      fields: [
        { label: 'Status', value: adr.status.toUpperCase() },
        { label: 'Subsystem', value: adr.subsystem.toUpperCase() },
      ],
    });

    return NextResponse.json(adr, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
