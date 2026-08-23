export interface LlmProvider {
	generateJson(prompt: string, schema: Record<string, unknown>): Promise<Record<string, unknown>>;
}

/** The provider itself is down or unreachable — not retried by the route. */
export class ProviderUnavailableError extends Error {}

/** The provider responded, but the output couldn't be parsed as JSON. */
export class ProviderOutputError extends Error {}
