import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { LlmProvider } from '$lib/server/llm/provider';
import { generateValidatedWithRetry } from '$lib/server/llm/generateValidated';

interface ModelSummary {
	slug: string;
	name: string;
	description: string;
}

interface RecommendRequestBody {
	questionText: string;
	models: ModelSummary[];
}

function buildPrompt(questionText: string, models: ModelSummary[]): string {
	const catalog = models.map((m) => `- ${m.slug}: ${m.name} — ${m.description}`).join('\n');
	return `You are helping someone pick which mental models would give the most useful lens on their question.

Question: "${questionText}"

Available models:
${catalog}

Pick between 1 and 5 models from the list above that would be most useful for reasoning through this specific question. Return their slugs exactly as written above.`;
}

function buildSchema(models: ModelSummary[]): Record<string, unknown> {
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

		const body = (await event.request.json()) as RecommendRequestBody;
		const provider = makeProvider(apiKey);
		const prompt = buildPrompt(body.questionText, body.models);
		const schema = buildSchema(body.models);

		const result = await generateValidatedWithRetry(provider, prompt, schema);
		if (result.ok) {
			return json({ modelSlugs: result.resultJson.modelSlugs as string[] });
		}
		return json({ error: result.kind }, { status: 502 });
	};
}
