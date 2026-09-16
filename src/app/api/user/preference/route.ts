import { NextRequest, NextResponse } from 'next/server';
import { setUserDefaultProject, getUser } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, defaultProjectId } = body;

    if (!email || !defaultProjectId) {
      return NextResponse.json({ error: 'email and defaultProjectId are required' }, { status: 400 });
    }

    const updated = await setUserDefaultProject(email, defaultProjectId);
    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'email query param is required' }, { status: 400 });
    }

    const user = await getUser(email);
    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
