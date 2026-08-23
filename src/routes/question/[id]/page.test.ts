import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import { db } from '$lib/db';
import { createQuestion } from '$lib/stores/questions';
import { createAnalysis } from '$lib/stores/analyses';
import { syncSeedModels } from '$lib/db/seed';
import seedModels from '$lib/db/seed-models.json';
import type { ModelDef } from '$lib/types';
import Page from './+page.svelte';

let questionId: string;

vi.mock('$app/state', () => ({
	get page() {
		return { params: { id: questionId } };
	}
}));

const eisenhower = (seedModels as unknown as ModelDef[]).find(
	(m) => m.slug === 'eisenhower-matrix'
)!;

describe('/question/[id] page', () => {
	beforeEach(async () => {
		await db.questions.clear();
		await db.models.clear();
		await db.analyses.clear();
		await syncSeedModels();
		const q = await createQuestion('Should I take the job?');
		questionId = q.id;
	});

	it('shows the question text and the model picker grouped by category', async () => {
		render(Page);
		expect(await screen.findByText('Should I take the job?')).toBeTruthy();
		expect(await screen.findByText('Eisenhower Matrix')).toBeTruthy();
		expect(await screen.findByText('Johari Window')).toBeTruthy();
	});

	it('shows a not-found message for an unknown question id', async () => {
		questionId = 'does-not-exist';
		render(Page);
		expect(await screen.findByText('Question not found.')).toBeTruthy();
	});

	it('links each model card to its dedicated analysis page', async () => {
		render(Page);
		const link = (await screen.findByText('Eisenhower Matrix')).closest('a');
		expect(link?.getAttribute('href')).toBe(`/question/${questionId}/eisenhower-matrix`);
	});

	it('shows an Analyzed badge only for models with existing history', async () => {
		await createAnalysis(questionId, eisenhower.id, eisenhower.example.result);
		render(Page);
		const card = (await screen.findByText('Eisenhower Matrix')).closest(
			'[data-testid]'
		) as HTMLElement;
		expect(await within(card).findByText('Analyzed')).toBeTruthy();

		const johariCard = (await screen.findByText('Johari Window')).closest(
			'[data-testid]'
		) as HTMLElement;
		expect(within(johariCard).queryByText('Analyzed')).toBeNull();
	});
});
