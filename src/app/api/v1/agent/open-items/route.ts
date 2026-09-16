import { NextRequest, NextResponse } from 'next/server';
import { validateAgentApiKey } from '@/lib/agent-auth';
import { getOpenItems, createOpenItem, logActivity } from '@/lib/storage';
import { sendSlackNotification } from '@/lib/slack';
import { ItemStatus, Priority } from '@/lib/types';

export async function GET(req: NextRequest) {
  const auth = validateAgentApiKey(req);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as ItemStatus | null;
  const priority = searchParams.get('priority') as Priority | null;

  let items = await getOpenItems();
  if (status) {
    items = items.filter(i => i.status === status);
  }
  if (priority) {
    items = items.filter(i => i.priority === priority);
  }

  return NextResponse.json({ items, count: items.length });
}

export async function POST(req: NextRequest) {
  const auth = validateAgentApiKey(req);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, priority = 'medium', owner = 'AI Agent', dueDate, tags = [] } = body;
    const projectId =
      body.projectId ||
      req.headers.get('x-project-id') ||
      req.nextUrl.searchParams.get('projectId') ||
      'proj-mohawk';

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required and must be a string' }, { status: 400 });
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const sanitizedPriority = validPriorities.includes(priority) ? priority : 'medium';

    const item = await createOpenItem({
      projectId,
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      status: 'todo',
      priority: sanitizedPriority as any,
      owner: typeof owner === 'string' ? owner.trim() : 'AI Agent',
      dueDate: dueDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      tags: Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : [],
    });

    await logActivity({
      actor: { name: owner, type: 'agent' },
      action: 'Created Action Item via Agent API',
      details: `Created: "${item.title}" [Priority: ${item.priority}]`,
      category: 'item',
      link: '/open-items',
    });

    await sendSlackNotification({
      title: 'New Action Item Created by AI Agent',
      message: `*${item.title}*\n${item.description}`,
      category: 'item',
      actorName: owner,
      actorType: 'agent',
      fields: [
        { label: 'Priority', value: item.priority.toUpperCase() },
        { label: 'Owner', value: item.owner },
        { label: 'Due Date', value: item.dueDate },
      ],
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
