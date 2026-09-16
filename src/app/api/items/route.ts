import { NextRequest, NextResponse } from 'next/server';
import { getOpenItems, createOpenItem, logActivity } from '@/lib/storage';
import { sendSlackNotification } from '@/lib/slack';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') || undefined;
  const items = await getOpenItems(projectId);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const item = await createOpenItem(body);

    await logActivity({
      projectId: item.projectId,
      actor: { name: body.owner || 'Team Member', type: 'user' },
      action: 'Created Action Item',
      details: `Created item: "${item.title}" [${item.priority}]`,
      category: 'item',
      link: '/open-items',
    });

    await sendSlackNotification({
      title: 'New Open Item Added',
      message: `*${item.title}*\n${item.description}`,
      category: 'item',
      actorName: item.owner,
      actorType: 'user',
      fields: [
        { label: 'Priority', value: item.priority.toUpperCase() },
        { label: 'Owner', value: item.owner },
        { label: 'Due Date', value: item.dueDate },
      ],
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
