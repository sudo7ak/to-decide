import { Validator, type Schema } from '@cfworker/json-schema';

export function isValidAgainstSchema(schema: Record<string, unknown>, data: unknown): boolean {
	const validator = new Validator(schema as Schema);
	return validator.validate(data).valid;
}
