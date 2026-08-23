import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { createQuestion, listQuestions, getQuestion, setRecommendedModels } from './questions';

describe('questions store', () => {
	beforeEach(async () => {
		await db.questions.clear();
	});

	it('creates a question with generated id and timestamp', async () => {
		const q = await createQuestion('Should I take the job?');
		expect(q.id).toBeTruthy();
		expect(q.text).toBe('Should I take the job?');
		expect(q.createdAt).toBeTruthy();
	});

	it('rejects an empty question', async () => {
		await expect(createQuestion('   ')).rejects.toThrow('Question text cannot be empty');
	});

	it('lists questions newest first', async () => {
		const first = await createQuestion('First question');
		await new Promise((r) => setTimeout(r, 5));
		const second = await createQuestion('Second question');
		const list = await listQuestions();
		expect(list.map((q) => q.id)).toEqual([second.id, first.id]);
	});

	it('gets a question by id', async () => {
		const created = await createQuestion('Should I move cities?');
		const found = await getQuestion(created.id);
		expect(found?.text).toBe('Should I move cities?');
	});

	it('sets recommended model ids on a question', async () => {
		const created = await createQuestion('Should I take the job?');
		expect(created.recommendedModelIds).toBeUndefined();

		await setRecommendedModels(created.id, ['m1', 'm2']);

		const found = await getQuestion(created.id);
		expect(found?.recommendedModelIds).toEqual(['m1', 'm2']);
	});
});
