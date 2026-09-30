import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { LlmProvider } from '$lib/server/llm/provider';
import { generateValidatedWithRetry } from '$lib/server/llm/generateValidated';
import { getModelBySlug } from '$lib/server/catalog';
import { readJsonBody, readQuestionText } from '$lib/server/requestBody';
import { rateLimitResponse } from '$lib/server/rateLimit';

/**
 * The caller names a model by slug and supplies its own question text — nothing
 * more. The prompt template and output schema come from the server's own copy
 * of the catalog, so this route can only ever run one of the catalog's prompts.
 */
interface AnalyzeRequestBody {
	slug?: unknown;
	questionText?: unknown;
}

export function createAnalyzeHandler(makeProvider: (apiKey: string) => LlmProvider): RequestHandler {
	return async (event) => {
		const apiKey = event.platform?.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw error(500, 'GEMINI_API_KEY is not configured');
		}

		const limited = await rateLimitResponse(event);
		if (limited) {
			return limited;
		}

		const body = await readJsonBody<AnalyzeRequestBody>(event.request);
		const questionText = readQuestionText(body.questionText);

		if (typeof body.slug !== 'string') {
			throw error(400, 'slug must be a string');
		}
		const model = getModelBySlug(body.slug);
		if (!model) {
			throw error(400, 'Unknown model slug');
		}

		const prompt = model.promptTemplate.replaceAll('{{question}}', questionText);
		const provider = makeProvider(apiKey);

		const result = await generateValidatedWithRetry(provider, prompt, model.outputJsonSchema);
		if (result.ok) {
			return json({ resultJson: result.resultJson });
		}
		return json({ error: result.kind }, { status: 502 });
	};
}
