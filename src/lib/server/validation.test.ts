import { describe, it, expect } from 'vitest';
import seedModels from '../db/seed-models.json';
import { isValidAgainstSchema } from './validation';
import type { ModelDef } from '../types';

const models = seedModels as unknown as ModelDef[];

function modelBySlug(slug: string): ModelDef {
	const model = models.find((m) => m.slug === slug);
	if (!model) throw new Error(`fixture model not found: ${slug}`);
	return model;
}

describe('isValidAgainstSchema', () => {
	it('accepts the eisenhower-matrix (quadrant2x2) worked example', () => {
		const model = modelBySlug('eisenhower-matrix');
		expect(isValidAgainstSchema(model.outputJsonSchema, model.example.result)).toBe(true);
	});

	it('accepts the energy-model (radar) worked example', () => {
		const model = modelBySlug('energy-model');
		expect(isValidAgainstSchema(model.outputJsonSchema, model.example.result)).toBe(true);
	});

	it('accepts the swot-analysis (matrix_table) worked example', () => {
		const model = modelBySlug('swot-analysis');
		expect(isValidAgainstSchema(model.outputJsonSchema, model.example.result)).toBe(true);
	});

	it('rejects data missing a required field', () => {
		const model = modelBySlug('eisenhower-matrix');
		expect(isValidAgainstSchema(model.outputJsonSchema, { xAxisLabel: 'Urgency' })).toBe(false);
	});

	it('rejects data with the wrong type for a field', () => {
		const model = modelBySlug('swot-analysis');
		expect(isValidAgainstSchema(model.outputJsonSchema, { rows: 'not-an-array', summary: 'x' })).toBe(
			false
		);
	});
});
