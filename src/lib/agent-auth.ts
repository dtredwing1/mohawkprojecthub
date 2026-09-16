import { NextRequest } from 'next/server';
import crypto from 'crypto';

export function validateAgentApiKey(req: NextRequest): { valid: boolean; error?: string } {
  const isProd = process.env.NODE_ENV === 'production';
  const configuredKey = process.env.AGENT_API_KEY || (!isProd ? 'hub-agent-dev-key-12345' : '');

  if (!configuredKey) {
    console.error('AGENT_API_KEY environment variable is not configured in production.');
    return { valid: false, error: 'Server authentication misconfigured. Contact administrator.' };
  }

  const rawProvidedKey =
    req.headers.get('x-api-key') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!rawProvidedKey) {
    return { valid: false, error: 'Missing x-api-key header or Bearer authorization token.' };
  }

  try {
    // Constant-time comparison using sha256 to prevent timing attacks
    const configuredHash = crypto.createHash('sha256').update(configuredKey).digest();
    const providedHash = crypto.createHash('sha256').update(rawProvidedKey).digest();

    const isMatch = crypto.timingSafeEqual(configuredHash, providedHash);

    if (!isMatch) {
      return { valid: false, error: 'Invalid API key.' };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, error: 'Authentication verification failed.' };
  }
}
