import Ajv from 'ajv';

export function isValidAgainstSchema(schema: Record<string, unknown>, data: unknown): boolean {
	const ajv = new Ajv({ allErrors: true });
	const validate = ajv.compile(schema);
	return validate(data) === true;
}
