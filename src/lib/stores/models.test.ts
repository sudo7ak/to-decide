import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { seedModelsIfEmpty } from '../db/seed';
import { listModels, listModelsByCategory, getModelBySlug } from './models';

describe('models store', () => {
	beforeEach(async () => {
		await db.models.clear();
		await seedModelsIfEmpty();
	});

	it('lists all models', async () => {
		const models = await listModels();
		expect(models).toHaveLength(8);
	});

	it('filters models by category', async () => {
		const models = await listModelsByCategory('know-self');
		expect(models.map((m) => m.slug).sort()).toEqual(['cognitive-dissonance', 'johari-window']);
	});

	it('gets a single model by slug', async () => {
		const model = await getModelBySlug('swot-analysis');
		expect(model?.name).toBe('SWOT Analysis');
	});

	it('returns undefined for an unknown slug', async () => {
		const model = await getModelBySlug('does-not-exist');
		expect(model).toBeUndefined();
	});
});
