import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
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

// The question page renders one "Analyze" toggle per model card, so an
// unscoped `getByRole('button', { name: 'Analyze' })` is ambiguous — every
// query below is scoped to this one card via `within`.
function eisenhowerCard() {
	return within(screen.getByTestId(`model-card-${eisenhower.slug}`));
}

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

	it('shows an Analyze button when a model card is expanded with no history', async () => {
		render(Page);
		await screen.findByTestId(`model-card-${eisenhower.slug}`);
		await fireEvent.click(eisenhowerCard().getByRole('button', { name: 'Analyze' }));
		expect(eisenhowerCard().getByRole('button', { name: 'Analyze' })).toBeTruthy();
	});

	it('calls /api/analyze and renders the chart on a successful analyze', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ resultJson: eisenhower.example.result })
			})
		);
		render(Page);
		await screen.findByTestId(`model-card-${eisenhower.slug}`);
		// 1st click expands the card (toggle reads "Analyze" while collapsed);
		// 2nd click hits the now-revealed inline action button, also "Analyze".
		await fireEvent.click(eisenhowerCard().getByRole('button', { name: 'Analyze' }));
		await fireEvent.click(eisenhowerCard().getByRole('button', { name: 'Analyze' }));

		expect(await eisenhowerCard().findByText('Resolve the client emergency')).toBeTruthy();
		const stored = await db.analyses.where('questionId').equals(questionId).toArray();
		expect(stored).toHaveLength(1);
		expect(stored[0].resultJson).toEqual(eisenhower.example.result);
	});

	it('shows past runs and switches between them', async () => {
		await createAnalysis(questionId, eisenhower.id, {
			...eisenhower.example.result,
			summary: 'older run'
		});
		await new Promise((r) => setTimeout(r, 5));
		await createAnalysis(questionId, eisenhower.id, {
			...eisenhower.example.result,
			summary: 'newer run'
		});

		render(Page);
		await screen.findByTestId(`model-card-${eisenhower.slug}`);
		await fireEvent.click(eisenhowerCard().getByRole('button', { name: 'Analyze' }));

		expect(await eisenhowerCard().findByText('newer run')).toBeTruthy();
		const timestampButtons = eisenhowerCard()
			.getAllByRole('button')
			.filter((b) => b.textContent?.match(/\d{1,2}:\d{2}/));
		expect(timestampButtons).toHaveLength(2);

		await fireEvent.click(timestampButtons[1]);
		expect(await eisenhowerCard().findByText('older run')).toBeTruthy();
	});

	it('shows an error and a retry option when the request fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502 }));
		render(Page);
		await screen.findByTestId(`model-card-${eisenhower.slug}`);
		await fireEvent.click(eisenhowerCard().getByRole('button', { name: 'Analyze' }));
		await fireEvent.click(eisenhowerCard().getByRole('button', { name: 'Analyze' }));

		expect(await eisenhowerCard().findByText(/Analysis failed/)).toBeTruthy();
		expect(eisenhowerCard().getByRole('button', { name: 'Try again' })).toBeTruthy();
	});
});
