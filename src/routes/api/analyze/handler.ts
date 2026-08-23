import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { LlmProvider } from '$lib/server/llm/provider';
import { generateValidatedWithRetry } from '$lib/server/llm/generateValidated';

interface AnalyzeRequestBody {
	promptTemplate: string;
	outputJsonSchema: Record<string, unknown>;
}

export function createAnalyzeHandler(makeProvider: (apiKey: string) => LlmProvider): RequestHandler {
	return async (event) => {
		const apiKey = event.platform?.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw error(500, 'GEMINI_API_KEY is not configured');
		}

		const body = (await event.request.json()) as AnalyzeRequestBody;
		const provider = makeProvider(apiKey);

		const result = await generateValidatedWithRetry(
			provider,
			body.promptTemplate,
			body.outputJsonSchema
		);
		if (result.ok) {
			return json({ resultJson: result.resultJson });
		}
		return json({ error: result.kind }, { status: 502 });
	};
}
