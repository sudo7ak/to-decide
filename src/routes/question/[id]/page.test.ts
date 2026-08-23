import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import { db } from '$lib/db';
import { createQuestion, getQuestion, setRecommendedModels } from '$lib/stores/questions';
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

	afterEach(() => {
		vi.unstubAllGlobals();
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

	it('fetches recommendations on first view, badges and sorts the picked models to the top of their category, and caches the result', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ modelSlugs: ['choice-overload'] })
			})
		);
		render(Page);

		const card = await screen.findByTestId('model-card-choice-overload');
		expect(await within(card).findByText('Recommended')).toBeTruthy();

		const cardIds = screen
			.getAllByTestId(/^model-card-/)
			.map((el) => el.getAttribute('data-testid'));
		expect(cardIds.indexOf('model-card-choice-overload')).toBeLessThan(
			cardIds.indexOf('model-card-swot-analysis')
		);

		const stored = await getQuestion(questionId);
		expect(stored?.recommendedModelIds).toEqual([
			(await db.models.where('slug').equals('choice-overload').first())!.id
		]);
	});

	it('does not call the recommend API again once a question already has cached recommendations', async () => {
		const model = await db.models.where('slug').equals('choice-overload').first();
		await setRecommendedModels(questionId, [model!.id]);
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		render(Page);
		expect(await screen.findByText('Recommended')).toBeTruthy();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('shows no Recommended badges and does not crash if the recommend request fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502 }));
		render(Page);
		expect(await screen.findByText('Eisenhower Matrix')).toBeTruthy();
		expect(screen.queryByText('Recommended')).toBeNull();
	});
});
