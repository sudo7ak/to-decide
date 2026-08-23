import type { LlmProvider } from './provider';
import { ProviderUnavailableError } from './provider';
import { isValidAgainstSchema } from '$lib/server/validation';

export type GenerateAttemptResult =
	| { ok: true; resultJson: Record<string, unknown> }
	| { ok: false; kind: 'provider_unavailable' | 'validation_failed' };

async function attempt(
	provider: LlmProvider,
	prompt: string,
	schema: Record<string, unknown>
): Promise<GenerateAttemptResult> {
	let resultJson: Record<string, unknown>;
	try {
		resultJson = await provider.generateJson(prompt, schema);
	} catch (err) {
		if (err instanceof ProviderUnavailableError) {
			return { ok: false, kind: 'provider_unavailable' };
		}
		return { ok: false, kind: 'validation_failed' };
	}

	if (isValidAgainstSchema(schema, resultJson)) {
		return { ok: true, resultJson };
	}
	return { ok: false, kind: 'validation_failed' };
}

/**
 * Calls the provider and validates its output against the schema, retrying
 * once on a validation-shaped failure. A provider-unavailable failure is
 * never retried — see $lib/server/llm/provider.ts for the distinction.
 */
export async function generateValidatedWithRetry(
	provider: LlmProvider,
	prompt: string,
	schema: Record<string, unknown>
): Promise<GenerateAttemptResult> {
	const first = await attempt(provider, prompt, schema);
	if (first.ok || first.kind === 'provider_unavailable') {
		return first;
	}
	return attempt(provider, prompt, schema);
}
