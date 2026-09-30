import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/** Seconds a rate-limited caller is asked to wait; matches the binding's period. */
const RETRY_AFTER_SECONDS = 60;

/**
 * Applies the Cloudflare Rate Limiting binding to an LLM-backed route, keyed by
 * client IP. The binding is configured in `wrangler.jsonc` and only exists on
 * the deployed Worker — under `vite dev` and in tests it is absent, and this is
 * a no-op rather than a hard failure.
 *
 * Returns a 429 response to return from the handler, or `null` to continue.
 */
export async function rateLimitResponse(event: RequestEvent): Promise<Response | null> {
	const limiter = event.platform?.env.RATE_LIMITER;
	if (!limiter) {
		return null;
	}

	const { success } = await limiter.limit({ key: event.getClientAddress() });
	if (success) {
		return null;
	}

	return json(
		{ error: 'rate_limited' },
		{ status: 429, headers: { 'Retry-After': String(RETRY_AFTER_SECONDS) } }
	);
}
