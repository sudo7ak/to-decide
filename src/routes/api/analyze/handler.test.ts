import { describe, it, expect, vi } from 'vitest';
import type { RequestHandler } from '@sveltejs/kit';
import { createAnalyzeHandler } from './handler';
import type { LlmProvider } from '$lib/server/llm/provider';
import { ProviderUnavailableError } from '$lib/server/llm/provider';

const validSchema = {
	type: 'object',
	required: ['summary'],
	properties: { summary: { type: 'string' } }
};

function makeEvent(
	body: unknown,
	apiKey: string | undefined
): Parameters<RequestHandler>[0] {
	return {
		request: new Request('http://localhost/api/analyze', {
			method: 'POST',
			body: JSON.stringify(body)
		}),
		platform: apiKey ? { env: { GEMINI_API_KEY: apiKey } } : undefined
	} as Parameters<RequestHandler>[0];
}

function mockProvider(generateJson: LlmProvider['generateJson']): LlmProvider {
	return { generateJson };
}

describe('createAnalyzeHandler', () => {
	it('returns 200 with resultJson when the first attempt validates', async () => {
		const generateJson = vi.fn().mockResolvedValue({ summary: 'ok' });
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));

		const res = await handler(
			makeEvent({ promptTemplate: 'p', outputJsonSchema: validSchema }, 'key')
		);

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ resultJson: { summary: 'ok' } });
		expect(generateJson).toHaveBeenCalledTimes(1);
	});

	it('retries once when the first attempt fails validation, then succeeds', async () => {
		const generateJson = vi
			.fn()
			.mockResolvedValueOnce({ wrong: 'shape' })
			.mockResolvedValueOnce({ summary: 'ok' });
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));

		const res = await handler(
			makeEvent({ promptTemplate: 'p', outputJsonSchema: validSchema }, 'key')
		);

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ resultJson: { summary: 'ok' } });
		expect(generateJson).toHaveBeenCalledTimes(2);
	});

	it('returns 502 validation_failed when both attempts fail validation', async () => {
		const generateJson = vi.fn().mockResolvedValue({ wrong: 'shape' });
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));

		const res = await handler(
			makeEvent({ promptTemplate: 'p', outputJsonSchema: validSchema }, 'key')
		);

		expect(res.status).toBe(502);
		expect(await res.json()).toEqual({ error: 'validation_failed' });
		expect(generateJson).toHaveBeenCalledTimes(2);
	});

	it('returns 502 provider_unavailable immediately, without retrying', async () => {
		const generateJson = vi.fn().mockRejectedValue(new ProviderUnavailableError('down'));
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));

		const res = await handler(
			makeEvent({ promptTemplate: 'p', outputJsonSchema: validSchema }, 'key')
		);

		expect(res.status).toBe(502);
		expect(await res.json()).toEqual({ error: 'provider_unavailable' });
		expect(generateJson).toHaveBeenCalledTimes(1);
	});

	it('throws a 500 error when GEMINI_API_KEY is not configured', async () => {
		const generateJson = vi.fn();
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));

		await expect(
			handler(makeEvent({ promptTemplate: 'p', outputJsonSchema: validSchema }, undefined))
		).rejects.toMatchObject({ status: 500 });
		expect(generateJson).not.toHaveBeenCalled();
	});
});
