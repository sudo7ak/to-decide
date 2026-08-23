import { describe, it, expect, vi, afterEach } from 'vitest';
import { GeminiProvider } from './gemini';
import { ProviderUnavailableError, ProviderOutputError } from './provider';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('GeminiProvider', () => {
	it('parses JSON out of the first text part', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					candidates: [{ content: { parts: [{ text: '{"summary":"ok"}' }] } }]
				})
			})
		);
		const provider = new GeminiProvider('test-key');
		const result = await provider.generateJson('prompt', { type: 'object' });
		expect(result).toEqual({ summary: 'ok' });
	});

	it('sends the prompt, schema, and API key in the request', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ candidates: [{ content: { parts: [{ text: '{}' }] } }] })
		});
		vi.stubGlobal('fetch', fetchMock);
		const provider = new GeminiProvider('test-key');
		const schema = { type: 'object', required: ['summary'] };
		await provider.generateJson('Should I take the job?', schema);

		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toContain('generateContent');
		expect(init.headers['X-goog-api-key']).toBe('test-key');
		const body = JSON.parse(init.body);
		expect(body.contents[0].parts[0].text).toBe('Should I take the job?');
		expect(body.generationConfig.responseSchema).toEqual(schema);
		expect(body.generationConfig.responseMimeType).toBe('application/json');
	});

	it('throws ProviderUnavailableError when the HTTP response is not ok', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
		const provider = new GeminiProvider('test-key');
		await expect(provider.generateJson('prompt', {})).rejects.toBeInstanceOf(
			ProviderUnavailableError
		);
	});

	it('throws ProviderUnavailableError when fetch itself rejects', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
		const provider = new GeminiProvider('test-key');
		await expect(provider.generateJson('prompt', {})).rejects.toBeInstanceOf(
			ProviderUnavailableError
		);
	});

	it('throws ProviderOutputError when no text part is present', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ candidates: [{ content: { parts: [{}] } }] })
			})
		);
		const provider = new GeminiProvider('test-key');
		await expect(provider.generateJson('prompt', {})).rejects.toBeInstanceOf(ProviderOutputError);
	});

	it('throws ProviderOutputError when the text part is not valid JSON', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ candidates: [{ content: { parts: [{ text: 'not json' }] } }] })
			})
		);
		const provider = new GeminiProvider('test-key');
		await expect(provider.generateJson('prompt', {})).rejects.toBeInstanceOf(ProviderOutputError);
	});
});
