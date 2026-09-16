import { NextRequest, NextResponse } from 'next/server';
import { updateADR, logActivity } from '@/lib/storage';
import { sendSlackNotification } from '@/lib/slack';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateADR(id, body);

    if (!updated) {
      return NextResponse.json({ error: 'ADR not found' }, { status: 404 });
    }

    await logActivity({
      actor: { name: body.actorName || updated.author, type: 'user' },
      action: 'Updated ADR Status',
      details: `ADR #${updated.number} "${updated.title}" changed to ${updated.status.toUpperCase()}`,
      category: 'adr',
      link: '/decisions',
    });

    if (body.status) {
      await sendSlackNotification({
        title: `ADR #${updated.number} Updated to ${updated.status.toUpperCase()}`,
        message: `*${updated.title}* status changed to *${updated.status}*`,
        category: 'adr',
        actorName: updated.author,
        actorType: 'user',
      });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
