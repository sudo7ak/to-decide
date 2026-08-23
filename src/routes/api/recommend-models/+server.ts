import { GeminiProvider } from '$lib/server/llm/gemini';
import { createRecommendModelsHandler } from './handler';

export const POST = createRecommendModelsHandler((apiKey) => new GeminiProvider(apiKey));
