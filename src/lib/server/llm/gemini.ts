import type { LlmProvider } from './provider';
import { ProviderUnavailableError, ProviderOutputError } from './provider';

const GEMINI_URL =
	'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

export class GeminiProvider implements LlmProvider {
	constructor(private apiKey: string) {}

	async generateJson(
		prompt: string,
		schema: Record<string, unknown>
	): Promise<Record<string, unknown>> {
		let res: Response;
		try {
			res = await fetch(GEMINI_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-goog-api-key': this.apiKey
				},
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }],
					generationConfig: {
						responseMimeType: 'application/json',
						responseSchema: schema
					}
				})
			});
		} catch {
			throw new ProviderUnavailableError('Gemini request failed: network error');
		}

		if (!res.ok) {
			throw new ProviderUnavailableError(`Gemini request failed with status ${res.status}`);
		}

		const data = (await res.json()) as {
			candidates?: { content?: { parts?: { text?: string }[] } }[];
		};
		const text = data.candidates?.[0]?.content?.parts?.find(
			(p): p is { text: string } => typeof p.text === 'string'
		)?.text;

		if (!text) {
			throw new ProviderOutputError('Gemini response contained no text part');
		}

		try {
			return JSON.parse(text) as Record<string, unknown>;
		} catch {
			throw new ProviderOutputError('Gemini response was not valid JSON');
		}
	}
}
