import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';

describe('DecisionCopilotDB', () => {
	beforeEach(async () => {
		await db.models.clear();
		await db.questions.clear();
		await db.analyses.clear();
	});

	it('stores and retrieves a question', async () => {
		await db.questions.add({
			id: 'q1',
			text: 'Should I take the job?',
			createdAt: '2026-08-22T00:00:00.000Z'
		});
		const found = await db.questions.get('q1');
		expect(found?.text).toBe('Should I take the job?');
	});

	it('stores and retrieves a model by slug via index', async () => {
		await db.models.add({
			id: 'm1',
			slug: 'eisenhower-matrix',
			name: 'Eisenhower Matrix',
			category: 'decision-making',
			description: 'd',
			whenToUse: 'w',
			promptTemplate: 'p',
			outputSchemaType: 'quadrant2x2',
			outputJsonSchema: {},
			chartComponent: 'Quadrant2x2Chart',
			createdAt: '2026-08-22T00:00:00.000Z',
			updatedAt: '2026-08-22T00:00:00.000Z'
		});
		const found = await db.models.where('slug').equals('eisenhower-matrix').first();
		expect(found?.name).toBe('Eisenhower Matrix');
	});
});
