import { NextResponse } from 'next/server';
import { getActivities } from '@/lib/storage';

export async function GET() {
  const activities = await getActivities(60);
  return NextResponse.json(activities);
}
