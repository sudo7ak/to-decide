import { describe, it, expect, vi } from 'vitest';
import type { RequestHandler } from '@sveltejs/kit';
import { createRecommendModelsHandler } from './handler';
import type { LlmProvider } from '$lib/server/llm/provider';
import { ProviderUnavailableError } from '$lib/server/llm/provider';

const validBody = {
	questionText: 'Should I take the job?',
	models: [
		{ slug: 'eisenhower-matrix', name: 'Eisenhower Matrix', description: 'Urgency vs importance' },
		{ slug: 'swot-analysis', name: 'SWOT Analysis', description: 'Strengths/weaknesses/etc' }
	]
};

function makeEvent(body: unknown, apiKey: string | undefined): Parameters<RequestHandler>[0] {
	return {
		request: new Request('http://localhost/api/recommend-models', {
			method: 'POST',
			body: JSON.stringify(body)
		}),
		platform: apiKey ? { env: { GEMINI_API_KEY: apiKey } } : undefined
	} as Parameters<RequestHandler>[0];
}

function mockProvider(generateJson: LlmProvider['generateJson']): LlmProvider {
	return { generateJson };
}

describe('createRecommendModelsHandler', () => {
	it('returns 200 with modelSlugs when the first attempt validates', async () => {
		const generateJson = vi.fn().mockResolvedValue({ modelSlugs: ['eisenhower-matrix'] });
		const handler = createRecommendModelsHandler(() => mockProvider(generateJson));

		const res = await handler(makeEvent(validBody, 'key'));

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ modelSlugs: ['eisenhower-matrix'] });
		expect(generateJson).toHaveBeenCalledTimes(1);
	});

	it('constrains the schema to the exact slugs sent in the request', async () => {
		const generateJson = vi.fn().mockResolvedValue({ modelSlugs: ['eisenhower-matrix'] });
		const handler = createRecommendModelsHandler(() => mockProvider(generateJson));

		await handler(makeEvent(validBody, 'key'));

		const [, schema] = generateJson.mock.calls[0];
		expect(schema.properties.modelSlugs.items.enum).toEqual([
			'eisenhower-matrix',
			'swot-analysis'
		]);
	});

	it('includes the question text and model catalog in the prompt', async () => {
		const generateJson = vi.fn().mockResolvedValue({ modelSlugs: ['eisenhower-matrix'] });
		const handler = createRecommendModelsHandler(() => mockProvider(generateJson));

		await handler(makeEvent(validBody, 'key'));

		const [prompt] = generateJson.mock.calls[0];
		expect(prompt).toContain('Should I take the job?');
		expect(prompt).toContain('eisenhower-matrix');
		expect(prompt).toContain('swot-analysis');
	});

	it('retries once when the first attempt fails validation, then succeeds', async () => {
		const generateJson = vi
			.fn()
			.mockResolvedValueOnce({ modelSlugs: ['not-a-real-slug'] })
			.mockResolvedValueOnce({ modelSlugs: ['swot-analysis'] });
		const handler = createRecommendModelsHandler(() => mockProvider(generateJson));

		const res = await handler(makeEvent(validBody, 'key'));

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ modelSlugs: ['swot-analysis'] });
		expect(generateJson).toHaveBeenCalledTimes(2);
	});

	it('returns 502 validation_failed when both attempts fail validation', async () => {
		const generateJson = vi.fn().mockResolvedValue({ modelSlugs: ['not-a-real-slug'] });
		const handler = createRecommendModelsHandler(() => mockProvider(generateJson));

		const res = await handler(makeEvent(validBody, 'key'));

		expect(res.status).toBe(502);
		expect(await res.json()).toEqual({ error: 'validation_failed' });
		expect(generateJson).toHaveBeenCalledTimes(2);
	});

	it('returns 502 provider_unavailable immediately, without retrying', async () => {
		const generateJson = vi.fn().mockRejectedValue(new ProviderUnavailableError('down'));
		const handler = createRecommendModelsHandler(() => mockProvider(generateJson));

		const res = await handler(makeEvent(validBody, 'key'));

		expect(res.status).toBe(502);
		expect(await res.json()).toEqual({ error: 'provider_unavailable' });
		expect(generateJson).toHaveBeenCalledTimes(1);
	});

	it('throws a 500 error when GEMINI_API_KEY is not configured', async () => {
		const generateJson = vi.fn();
		const handler = createRecommendModelsHandler(() => mockProvider(generateJson));

		await expect(handler(makeEvent(validBody, undefined))).rejects.toMatchObject({ status: 500 });
		expect(generateJson).not.toHaveBeenCalled();
	});
});
