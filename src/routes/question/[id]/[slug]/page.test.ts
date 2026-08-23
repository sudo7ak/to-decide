import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { db } from '$lib/db';
import { createQuestion } from '$lib/stores/questions';
import { createAnalysis } from '$lib/stores/analyses';
import { syncSeedModels } from '$lib/db/seed';
import seedModels from '$lib/db/seed-models.json';
import type { ModelDef } from '$lib/types';
import Page from './+page.svelte';

let questionId: string;
let slug: string;

const eisenhower = (seedModels as unknown as ModelDef[]).find(
	(m) => m.slug === 'eisenhower-matrix'
)!;

vi.mock('$app/state', () => ({
	get page() {
		return { params: { id: questionId, slug } };
	}
}));

describe('/question/[id]/[slug] page', () => {
	beforeEach(async () => {
		await db.questions.clear();
		await db.models.clear();
		await db.analyses.clear();
		await syncSeedModels();
		const q = await createQuestion('Should I take the job?');
		questionId = q.id;
		slug = eisenhower.slug;
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('shows the question text, model name, and an Analyze button when no history exists', async () => {
		render(Page);
		expect(await screen.findByText('Should I take the job?')).toBeTruthy();
		expect(await screen.findByText('Eisenhower Matrix')).toBeTruthy();
		expect(await screen.findByRole('button', { name: 'Analyze' })).toBeTruthy();
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
		await fireEvent.click(await screen.findByRole('button', { name: 'Analyze' }));

		expect(await screen.findByText('Resolve the client emergency')).toBeTruthy();
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
		expect(await screen.findByText('newer run')).toBeTruthy();
		const timestampButtons = (await screen.findAllByRole('button')).filter((b) =>
			b.textContent?.match(/\d{1,2}:\d{2}/)
		);
		expect(timestampButtons).toHaveLength(2);

		await fireEvent.click(timestampButtons[1]);
		expect(await screen.findByText('older run')).toBeTruthy();
	});

	it('shows an error and a retry option when the request fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502 }));
		render(Page);
		await fireEvent.click(await screen.findByRole('button', { name: 'Analyze' }));

		expect(await screen.findByText(/Analysis failed/)).toBeTruthy();
		expect(await screen.findByRole('button', { name: 'Try again' })).toBeTruthy();
	});

	it('shows a not-found message for an unknown model slug', async () => {
		slug = 'does-not-exist';
		render(Page);
		expect(await screen.findByText('Question or model not found.')).toBeTruthy();
	});
});
