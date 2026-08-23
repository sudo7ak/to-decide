import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { createAnalysis, listAnalysesForQuestionAndModel, listAnalysesForQuestion } from './analyses';

describe('analyses store', () => {
	beforeEach(async () => {
		await db.analyses.clear();
	});

	it('creates an analysis with a generated id and timestamps', async () => {
		const a = await createAnalysis('q1', 'm1', { summary: 'ok' });
		expect(a.id).toBeTruthy();
		expect(a.questionId).toBe('q1');
		expect(a.modelId).toBe('m1');
		expect(a.resultJson).toEqual({ summary: 'ok' });
		expect(a.createdAt).toBeTruthy();
		expect(a.syncedAt).toBeNull();
	});

	it('lists analyses for a question+model pair, newest first', async () => {
		const first = await createAnalysis('q1', 'm1', { summary: 'first' });
		await new Promise((r) => setTimeout(r, 5));
		const second = await createAnalysis('q1', 'm1', { summary: 'second' });
		const list = await listAnalysesForQuestionAndModel('q1', 'm1');
		expect(list.map((a) => a.id)).toEqual([second.id, first.id]);
	});

	it('does not mix analyses from a different model on the same question', async () => {
		await createAnalysis('q1', 'm1', { summary: 'for m1' });
		await createAnalysis('q1', 'm2', { summary: 'for m2' });
		const list = await listAnalysesForQuestionAndModel('q1', 'm1');
		expect(list).toHaveLength(1);
		expect(list[0].resultJson).toEqual({ summary: 'for m1' });
	});

	it('does not mix analyses from a different question with the same model', async () => {
		await createAnalysis('q1', 'm1', { summary: 'for q1' });
		await createAnalysis('q2', 'm1', { summary: 'for q2' });
		const list = await listAnalysesForQuestionAndModel('q1', 'm1');
		expect(list).toHaveLength(1);
		expect(list[0].resultJson).toEqual({ summary: 'for q1' });
	});

	it('lists analyses for a question across every model, excluding other questions', async () => {
		await createAnalysis('q1', 'm1', { summary: 'q1/m1' });
		await createAnalysis('q1', 'm2', { summary: 'q1/m2' });
		await createAnalysis('q2', 'm1', { summary: 'q2/m1' });
		const list = await listAnalysesForQuestion('q1');
		expect(list.map((a) => a.modelId).sort()).toEqual(['m1', 'm2']);
	});
});
