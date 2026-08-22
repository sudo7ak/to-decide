import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { db } from '$lib/db';
import { createQuestion } from '$lib/stores/questions';
import { seedModelsIfEmpty } from '$lib/db/seed';
import Page from './+page.svelte';

let questionId: string;

vi.mock('$app/state', () => ({
	get page() {
		return { params: { id: questionId } };
	}
}));

describe('/question/[id] page', () => {
	beforeEach(async () => {
		await db.questions.clear();
		await db.models.clear();
		await seedModelsIfEmpty();
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
});
