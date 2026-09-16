import { NextRequest, NextResponse } from 'next/server';
import { getActivities } from '@/lib/storage';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') || undefined;
  const activities = await getActivities(projectId, 60);
  return NextResponse.json(activities);
}
