import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { seedModelsIfEmpty } from './seed';

describe('seedModelsIfEmpty', () => {
	beforeEach(async () => {
		await db.models.clear();
	});

	it('inserts all 8 seed models when the table is empty', async () => {
		await seedModelsIfEmpty();
		const count = await db.models.count();
		expect(count).toBe(8);
	});

	it('does not duplicate models when called twice', async () => {
		await seedModelsIfEmpty();
		await seedModelsIfEmpty();
		const count = await db.models.count();
		expect(count).toBe(8);
	});

	it('seeds a model with the expected shape', async () => {
		await seedModelsIfEmpty();
		const model = await db.models.where('slug').equals('eisenhower-matrix').first();
		expect(model?.name).toBe('Eisenhower Matrix');
		expect(model?.outputSchemaType).toBe('quadrant2x2');
	});
});
