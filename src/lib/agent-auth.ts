import { NextRequest } from 'next/server';

export function validateAgentApiKey(req: NextRequest): { valid: boolean; error?: string } {
  const configuredKey = process.env.AGENT_API_KEY || 'hub-agent-dev-key-12345';
  const providedKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');

  if (!providedKey) {
    return { valid: false, error: 'Missing x-api-key header or Bearer authorization token.' };
  }

  if (providedKey !== configuredKey) {
    return { valid: false, error: 'Invalid API key.' };
  }

  return { valid: true };
}
