import { error } from '@sveltejs/kit';

/** Longest question text either route will forward to the LLM. */
export const MAX_QUESTION_LENGTH = 1000;

/** Parses a JSON request body, answering 400 rather than 500 on malformed input. */
export async function readJsonBody<T>(request: Request): Promise<T> {
	try {
		return (await request.json()) as T;
	} catch {
		throw error(400, 'Request body must be valid JSON');
	}
}

/** Validates a caller-supplied question, throwing a 400 when it is unusable. */
export function readQuestionText(value: unknown): string {
	if (typeof value !== 'string') {
		throw error(400, 'questionText must be a string');
	}
	const trimmed = value.trim();
	if (!trimmed) {
		throw error(400, 'questionText must not be empty');
	}
	if (trimmed.length > MAX_QUESTION_LENGTH) {
		throw error(400, `questionText must be at most ${MAX_QUESTION_LENGTH} characters`);
	}
	return trimmed;
}
