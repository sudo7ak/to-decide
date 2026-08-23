import { GeminiProvider } from '$lib/server/llm/gemini';
import { createAnalyzeHandler } from './handler';

export const POST = createAnalyzeHandler((apiKey) => new GeminiProvider(apiKey));
