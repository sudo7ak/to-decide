import { describe, it, expect, vi } from 'vitest';
import type { RequestHandler } from '@sveltejs/kit';
import { createRecommendModelsHandler } from './handler';
import type { LlmProvider } from '$lib/server/llm/provider';
import { ProviderUnavailableError } from '$lib/server/llm/provider';
import { listCatalogEntries } from '$lib/server/catalog';
import { MAX_QUESTION_LENGTH } from '$lib/server/requestBody';

const catalog = listCatalogEntries();
const validBody = { questionText: 'Should I take the job?' };

interface EventOptions {
	withoutApiKey?: boolean;
	rateLimiter?: { limit: (options: { key: string }) => Promise<{ success: boolean }> };
	rawBody?: string;
}

function makeEvent(body: unknown, options: EventOptions = {}): Parameters<RequestHandler>[0] {
	const { withoutApiKey, rateLimiter, rawBody } = options;
	return {
		request: new Request('http://localhost/api/recommend-models', {
			method: 'POST',
			body: rawBody ?? JSON.stringify(body)
		}),
		getClientAddress: () => '203.0.113.7',
		platform: withoutApiKey ? undefined : { env: { GEMINI_API_KEY: 'key', RATE_LIMITER: rateLimiter } }
	} as unknown as Parameters<RequestHandler>[0];
}

function mockProvider(generateJson: LlmProvider['generateJson']): LlmProvider {
	return { generateJson };
}

describe('createRecommendModelsHandler', () => {
	it('returns 200 with modelSlugs when the first attempt validates', async () => {
		const generateJson = vi.fn().mockResolvedValue({ modelSlugs: ['eisenhower-matrix'] });
		const handler = createRecommendModelsHandler(() => mockProvider(generateJson));

		const res = await handler(makeEvent(validBody));

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ modelSlugs: ['eisenhower-matrix'] });
		expect(generateJson).toHaveBeenCalledTimes(1);
	});

	it('constrains the schema to the server catalog, ignoring any caller-supplied list', async () => {
		const generateJson = vi.fn().mockResolvedValue({ modelSlugs: ['eisenhower-matrix'] });
		const handler = createRecommendModelsHandler(() => mockProvider(generateJson));

		await handler(
			makeEvent({
				...validBody,
				models: [{ slug: 'smuggled-model', name: 'Smuggled', description: 'Not in the catalog' }]
			})
		);

		const [prompt, schema] = generateJson.mock.calls[0];
		expect(schema.properties.modelSlugs.items.enum).toEqual(catalog.map((m) => m.slug));
		expect(schema.properties.modelSlugs.items.enum).not.toContain('smuggled-model');
		expect(prompt).not.toContain('smuggled-model');
	});

	it('includes the question text and the full catalog in the prompt', async () => {
		const generateJson = vi.fn().mockResolvedValue({ modelSlugs: ['eisenhower-matrix'] });
		const handler = createRecommendModelsHandler(() => mockProvider(generateJson));

		await handler(makeEvent(validBody));

		const [prompt] = generateJson.mock.calls[0];
		expect(prompt).toContain('Should I take the job?');
		for (const entry of catalog) {
			expect(prompt).toContain(entry.slug);
		}
	});

	it('retries once when the first attempt fails validation, then succeeds', async () => {
		const generateJson = vi
			.fn()
			.mockResolvedValueOnce({ modelSlugs: ['not-a-real-slug'] })
			.mockResolvedValueOnce({ modelSlugs: ['swot-analysis'] });
		const handler = createRecommendModelsHandler(() => mockProvider(generateJson));

		const res = await handler(makeEvent(validBody));

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ modelSlugs: ['swot-analysis'] });
		expect(generateJson).toHaveBeenCalledTimes(2);
	});

	it('returns 502 validation_failed when both attempts fail validation', async () => {
		const generateJson = vi.fn().mockResolvedValue({ modelSlugs: ['not-a-real-slug'] });
		const handler = createRecommendModelsHandler(() => mockProvider(generateJson));

		const res = await handler(makeEvent(validBody));

		expect(res.status).toBe(502);
		expect(await res.json()).toEqual({ error: 'validation_failed' });
		expect(generateJson).toHaveBeenCalledTimes(2);
	});

	it('returns 502 provider_unavailable immediately, without retrying', async () => {
		const generateJson = vi.fn().mockRejectedValue(new ProviderUnavailableError('down'));
		const handler = createRecommendModelsHandler(() => mockProvider(generateJson));

		const res = await handler(makeEvent(validBody));

		expect(res.status).toBe(502);
		expect(await res.json()).toEqual({ error: 'provider_unavailable' });
		expect(generateJson).toHaveBeenCalledTimes(1);
	});

	it('throws a 500 error when GEMINI_API_KEY is not configured', async () => {
		const generateJson = vi.fn();
		const handler = createRecommendModelsHandler(() => mockProvider(generateJson));

		await expect(handler(makeEvent(validBody, { withoutApiKey: true }))).rejects.toMatchObject({
			status: 500
		});
		expect(generateJson).not.toHaveBeenCalled();
	});

	it('answers 400, not 500, when the body is not valid JSON', async () => {
		const generateJson = vi.fn();
		const handler = createRecommendModelsHandler(() => mockProvider(generateJson));

		await expect(handler(makeEvent(null, { rawBody: 'not-json' }))).rejects.toMatchObject({
			status: 400
		});
		expect(generateJson).not.toHaveBeenCalled();
	});

	it.each([
		['missing', undefined],
		['empty', '   '],
		['not a string', 42],
		['too long', 'x'.repeat(MAX_QUESTION_LENGTH + 1)]
	])('answers 400 when questionText is %s', async (_label, questionText) => {
		const generateJson = vi.fn();
		const handler = createRecommendModelsHandler(() => mockProvider(generateJson));

		await expect(handler(makeEvent({ questionText }))).rejects.toMatchObject({ status: 400 });
		expect(generateJson).not.toHaveBeenCalled();
	});

	it('answers 429 with Retry-After when the rate limiter rejects the caller', async () => {
		const generateJson = vi.fn();
		const handler = createRecommendModelsHandler(() => mockProvider(generateJson));
		const limit = vi.fn().mockResolvedValue({ success: false });

		const res = await handler(makeEvent(validBody, { rateLimiter: { limit } }));

		expect(res.status).toBe(429);
		expect(res.headers.get('Retry-After')).toBe('60');
		expect(limit).toHaveBeenCalledWith({ key: '203.0.113.7' });
		expect(generateJson).not.toHaveBeenCalled();
	});
});
