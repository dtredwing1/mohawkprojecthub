import { NextRequest, NextResponse } from 'next/server';
import {
  getUsers,
  getCollaboratorInvites,
  inviteCollaborator,
  deleteCollaborator,
  logActivity,
} from '@/lib/storage';
import { sendSlackNotification } from '@/lib/slack';

export async function GET() {
  try {
    const [users, invites] = await Promise.all([
      getUsers(),
      getCollaboratorInvites(),
    ]);
    return NextResponse.json({ users, invites });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, role, assignedProjectIds } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const invite = await inviteCollaborator({
      email: email.trim().toLowerCase(),
      role: role || 'member',
      assignedProjectIds: Array.isArray(assignedProjectIds) && assignedProjectIds.length > 0 ? assignedProjectIds : ['proj-mohawk'],
      invitedBy: 'Admin',
      invitedAt: new Date().toISOString(),
    });

    await logActivity({
      actor: { name: 'Admin', type: 'user' },
      action: 'Invited Collaborator',
      details: `Invited "${invite.email}" as ${invite.role} with ${invite.assignedProjectIds.length} workspace(s)`,
      category: 'system',
      link: '/settings',
    });

    await sendSlackNotification({
      title: 'New Collaborator Invited 👥',
      message: `*${invite.email}* was invited with role *${invite.role}*.`,
      category: 'system',
      fields: [
        { label: 'Email', value: invite.email },
        { label: 'Role', value: invite.role },
      ],
    });

    return NextResponse.json({ success: true, invite }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email query parameter is required' }, { status: 400 });
    }

    await deleteCollaborator(email);

    await logActivity({
      actor: { name: 'Admin', type: 'user' },
      action: 'Revoked Collaborator',
      details: `Revoked access for "${email}"`,
      category: 'system',
      link: '/settings',
    });

    return NextResponse.json({ success: true, email });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
