import { NextRequest, NextResponse } from 'next/server';
import { validateAgentApiKey } from '@/lib/agent-auth';
import { getStrategy, getADRs, getOpenItems, getDeliverables, getProject, getProjects } from '@/lib/storage';

export async function GET(req: NextRequest) {
  const auth = validateAgentApiKey(req);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const projectId =
    req.headers.get('x-project-id') ||
    req.nextUrl.searchParams.get('projectId') ||
    'proj-mohawk';

  const [project, strategy, adrs, openItems, deliverables, allProjects] = await Promise.all([
    getProject(projectId),
    getStrategy(projectId),
    getADRs(projectId),
    getOpenItems(projectId),
    getDeliverables(projectId),
    getProjects(),
  ]);

  return NextResponse.json({
    activeProject: project || { id: projectId, name: 'Project Hub' },
    availableProjects: allProjects.map(p => ({ id: p.id, name: p.name, key: p.key })),
    projectContext: {
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
