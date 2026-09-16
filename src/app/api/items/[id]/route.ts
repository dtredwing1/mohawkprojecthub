import { NextRequest, NextResponse } from 'next/server';
import { updateOpenItem, deleteOpenItem, logActivity } from '@/lib/storage';
import { sendSlackNotification } from '@/lib/slack';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateOpenItem(id, body);

    if (!updated) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    await logActivity({
      actor: { name: body.actorName || updated.owner, type: 'user' },
      action: 'Updated Action Item',
      details: `Updated "${updated.title}" -> Status: ${updated.status}`,
      category: 'item',
      link: '/open-items',
    });

    if (body.status === 'done') {
      await sendSlackNotification({
        title: 'Action Item Completed 🎉',
        message: `*${updated.title}* was marked as completed!`,
        category: 'item',
        actorName: updated.owner,
        actorType: 'user',
      });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteOpenItem(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
