import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { LlmProvider } from '$lib/server/llm/provider';
import { generateValidatedWithRetry } from '$lib/server/llm/generateValidated';
import { listCatalogEntries, type CatalogEntry } from '$lib/server/catalog';
import { readJsonBody, readQuestionText } from '$lib/server/requestBody';
import { rateLimitResponse } from '$lib/server/rateLimit';

/**
 * The caller supplies only its question — the catalog offered to the LLM is the
 * server's own, so this route can't be steered into summarising caller-supplied
 * text under the guise of a model list.
 */
interface RecommendRequestBody {
	questionText?: unknown;
}

function buildPrompt(questionText: string, models: CatalogEntry[]): string {
	const catalog = models.map((m) => `- ${m.slug}: ${m.name} — ${m.description}`).join('\n');
	return `You are helping someone pick which mental models would give the most useful lens on their question.

Question: "${questionText}"

Available models:
${catalog}

Pick between 1 and 5 models from the list above that would be most useful for reasoning through this specific question. Return their slugs exactly as written above.`;
}

function buildSchema(models: CatalogEntry[]): Record<string, unknown> {
	return {
		type: 'object',
		required: ['modelSlugs'],
		properties: {
			modelSlugs: {
				type: 'array',
				minItems: 1,
				maxItems: 5,
				items: { type: 'string', enum: models.map((m) => m.slug) }
			}
		}
	};
}

export function createRecommendModelsHandler(
	makeProvider: (apiKey: string) => LlmProvider
): RequestHandler {
	return async (event) => {
		const apiKey = event.platform?.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw error(500, 'GEMINI_API_KEY is not configured');
		}

		const limited = await rateLimitResponse(event);
		if (limited) {
			return limited;
		}

		const body = await readJsonBody<RecommendRequestBody>(event.request);
		const questionText = readQuestionText(body.questionText);

		const models = listCatalogEntries();
		const provider = makeProvider(apiKey);

		const result = await generateValidatedWithRetry(
			provider,
			buildPrompt(questionText, models),
			buildSchema(models)
		);
		if (result.ok) {
			return json({ modelSlugs: result.resultJson.modelSlugs as string[] });
		}
		return json({ error: result.kind }, { status: 502 });
	};
}
