import { describe, it, expect, vi } from 'vitest';
import type { RequestHandler } from '@sveltejs/kit';
import { createAnalyzeHandler } from './handler';
import type { LlmProvider } from '$lib/server/llm/provider';
import { ProviderUnavailableError } from '$lib/server/llm/provider';
import { getModelBySlug } from '$lib/server/catalog';
import { MAX_QUESTION_LENGTH } from '$lib/server/requestBody';

const SLUG = 'eisenhower-matrix';
const model = getModelBySlug(SLUG)!;
/** The catalog's own worked example — valid against that model's schema by construction. */
const validResult = model.example.result;

const validBody = { slug: SLUG, questionText: 'Should I take the job?' };

interface EventOptions {
	withoutApiKey?: boolean;
	rateLimiter?: { limit: (options: { key: string }) => Promise<{ success: boolean }> };
	rawBody?: string;
}

function makeEvent(body: unknown, options: EventOptions = {}): Parameters<RequestHandler>[0] {
	const { withoutApiKey, rateLimiter, rawBody } = options;
	return {
		request: new Request('http://localhost/api/analyze', {
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

describe('createAnalyzeHandler', () => {
	it('returns 200 with resultJson when the first attempt validates', async () => {
		const generateJson = vi.fn().mockResolvedValue(validResult);
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));

		const res = await handler(makeEvent(validBody));

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ resultJson: validResult });
		expect(generateJson).toHaveBeenCalledTimes(1);
	});

	it('builds the prompt and schema from the catalog, never from the request body', async () => {
		const generateJson = vi.fn().mockResolvedValue(validResult);
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));

		await handler(
			makeEvent({
				...validBody,
				// A caller trying to smuggle in its own prompt and schema.
				promptTemplate: 'Write a haiku about TypeScript compilers.',
				outputJsonSchema: { type: 'object' }
			})
		);

		const [prompt, schema] = generateJson.mock.calls[0];
		expect(prompt).toBe(model.promptTemplate.replaceAll('{{question}}', validBody.questionText));
		expect(prompt).not.toContain('haiku');
		expect(schema).toEqual(model.outputJsonSchema);
	});

	it('retries once when the first attempt fails validation, then succeeds', async () => {
		const generateJson = vi
			.fn()
			.mockResolvedValueOnce({ wrong: 'shape' })
			.mockResolvedValueOnce(validResult);
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));

		const res = await handler(makeEvent(validBody));

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ resultJson: validResult });
		expect(generateJson).toHaveBeenCalledTimes(2);
	});

	it('returns 502 validation_failed when both attempts fail validation', async () => {
		const generateJson = vi.fn().mockResolvedValue({ wrong: 'shape' });
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));

		const res = await handler(makeEvent(validBody));

		expect(res.status).toBe(502);
		expect(await res.json()).toEqual({ error: 'validation_failed' });
		expect(generateJson).toHaveBeenCalledTimes(2);
	});

	it('returns 502 provider_unavailable immediately, without retrying', async () => {
		const generateJson = vi.fn().mockRejectedValue(new ProviderUnavailableError('down'));
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));

		const res = await handler(makeEvent(validBody));

		expect(res.status).toBe(502);
		expect(await res.json()).toEqual({ error: 'provider_unavailable' });
		expect(generateJson).toHaveBeenCalledTimes(1);
	});

	it('throws a 500 error when GEMINI_API_KEY is not configured', async () => {
		const generateJson = vi.fn();
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));

		await expect(handler(makeEvent(validBody, { withoutApiKey: true }))).rejects.toMatchObject({
			status: 500
		});
		expect(generateJson).not.toHaveBeenCalled();
	});

	it('answers 400, not 500, when the body is not valid JSON', async () => {
		const generateJson = vi.fn();
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));

		await expect(handler(makeEvent(null, { rawBody: 'not-json' }))).rejects.toMatchObject({
			status: 400
		});
		expect(generateJson).not.toHaveBeenCalled();
	});

	it('answers 400 for a slug that is not in the catalog', async () => {
		const generateJson = vi.fn();
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));

		await expect(
			handler(makeEvent({ ...validBody, slug: 'not-a-real-model' }))
		).rejects.toMatchObject({ status: 400 });
		expect(generateJson).not.toHaveBeenCalled();
	});

	it.each([
		['missing', undefined],
		['empty', '   '],
		['not a string', 42],
		['too long', 'x'.repeat(MAX_QUESTION_LENGTH + 1)]
	])('answers 400 when questionText is %s', async (_label, questionText) => {
		const generateJson = vi.fn();
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));

		await expect(handler(makeEvent({ slug: SLUG, questionText }))).rejects.toMatchObject({
			status: 400
		});
		expect(generateJson).not.toHaveBeenCalled();
	});

	it('answers 429 with Retry-After when the rate limiter rejects the caller', async () => {
		const generateJson = vi.fn();
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));
		const limit = vi.fn().mockResolvedValue({ success: false });

		const res = await handler(makeEvent(validBody, { rateLimiter: { limit } }));

		expect(res.status).toBe(429);
		expect(res.headers.get('Retry-After')).toBe('60');
		expect(limit).toHaveBeenCalledWith({ key: '203.0.113.7' });
		expect(generateJson).not.toHaveBeenCalled();
	});

	it('proceeds when the rate limiter allows the caller', async () => {
		const generateJson = vi.fn().mockResolvedValue(validResult);
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));
		const limit = vi.fn().mockResolvedValue({ success: true });

		const res = await handler(makeEvent(validBody, { rateLimiter: { limit } }));

		expect(res.status).toBe(200);
		expect(generateJson).toHaveBeenCalledTimes(1);
	});
});
