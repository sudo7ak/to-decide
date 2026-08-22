import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { syncSeedModels } from './seed';

describe('syncSeedModels', () => {
	beforeEach(async () => {
		await db.models.clear();
	});

	it('inserts all 52 seed models when the table is empty', async () => {
		await syncSeedModels();
		const count = await db.models.count();
		expect(count).toBe(52);
	});

	it('does not duplicate models when called twice', async () => {
		await syncSeedModels();
		await syncSeedModels();
		const count = await db.models.count();
		expect(count).toBe(52);
	});

	it('seeds a model with the expected shape', async () => {
		await syncSeedModels();
		const model = await db.models.where('slug').equals('eisenhower-matrix').first();
		expect(model?.name).toBe('Eisenhower Matrix');
		expect(model?.outputSchemaType).toBe('quadrant2x2');
	});

	it('overwrites a stale local copy that predates newer seed fields', async () => {
		await db.models.add({
			id: 'eisenhower-matrix',
			slug: 'eisenhower-matrix',
			name: 'Eisenhower Matrix',
			category: 'decision-making',
			description: 'old description',
			whenToUse: 'old',
			// simulates a record persisted before origin/howToApply/pros/cons/example existed
			origin: undefined as unknown as string,
			howToApply: undefined as unknown as string[],
			pros: undefined as unknown as string[],
			cons: undefined as unknown as string[],
			example: undefined as unknown as { scenario: string; result: Record<string, unknown> },
			promptTemplate: 'old',
			outputSchemaType: 'quadrant2x2',
			outputJsonSchema: {},
			chartComponent: 'Quadrant2x2Chart',
			createdAt: '2020-01-01T00:00:00.000Z',
			updatedAt: '2020-01-01T00:00:00.000Z'
		});

		await syncSeedModels();

		const model = await db.models.where('slug').equals('eisenhower-matrix').first();
		expect(model?.example).toBeDefined();
		expect(model?.origin).toBeDefined();
		const count = await db.models.count();
		expect(count).toBe(52);
	});
});
