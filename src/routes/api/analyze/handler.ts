import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { LlmProvider } from '$lib/server/llm/provider';
import { ProviderUnavailableError } from '$lib/server/llm/provider';
import { isValidAgainstSchema } from '$lib/server/validation';

interface AnalyzeRequestBody {
	promptTemplate: string;
	outputJsonSchema: Record<string, unknown>;
}

type AttemptResult =
	| { ok: true; resultJson: Record<string, unknown> }
	| { ok: false; kind: 'provider_unavailable' | 'validation_failed' };

async function attempt(provider: LlmProvider, body: AnalyzeRequestBody): Promise<AttemptResult> {
	let resultJson: Record<string, unknown>;
	try {
		resultJson = await provider.generateJson(body.promptTemplate, body.outputJsonSchema);
	} catch (err) {
		if (err instanceof ProviderUnavailableError) {
			return { ok: false, kind: 'provider_unavailable' };
		}
		return { ok: false, kind: 'validation_failed' };
	}

	if (isValidAgainstSchema(body.outputJsonSchema, resultJson)) {
		return { ok: true, resultJson };
	}
	return { ok: false, kind: 'validation_failed' };
}

export function createAnalyzeHandler(makeProvider: (apiKey: string) => LlmProvider): RequestHandler {
	return async (event) => {
		const apiKey = event.platform?.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw error(500, 'GEMINI_API_KEY is not configured');
		}

		const body = (await event.request.json()) as AnalyzeRequestBody;
		const provider = makeProvider(apiKey);

		const first = await attempt(provider, body);
		if (first.ok) {
			return json({ resultJson: first.resultJson });
		}
		if (first.kind === 'provider_unavailable') {
			return json({ error: 'provider_unavailable' }, { status: 502 });
		}

		const second = await attempt(provider, body);
		if (second.ok) {
			return json({ resultJson: second.resultJson });
		}
		return json({ error: second.kind }, { status: 502 });
	};
}
