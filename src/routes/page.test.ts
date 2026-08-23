import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import { db } from '$lib/db';
import { createQuestion, setRecommendedModels } from '$lib/stores/questions';
import { syncSeedModels } from '$lib/db/seed';
import Page from './+page.svelte';

describe('/ page', () => {
	beforeEach(async () => {
		await db.questions.clear();
		await db.models.clear();
	});

	it('creates a question and shows it in the list', async () => {
		render(Page);

		const input = screen.getByPlaceholderText('What are you trying to decide?');
		await fireEvent.input(input, { target: { value: 'Should I take the job?' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Ask' }));

		expect(await screen.findByText('Should I take the job?')).toBeTruthy();
	});

	it('does not submit an empty question', async () => {
		render(Page);
		await fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
		const count = await db.questions.count();
		expect(count).toBe(0);
	});

	it('shows recommended model badges for a question that has them', async () => {
		await syncSeedModels();
		const eisenhower = await db.models.where('slug').equals('eisenhower-matrix').first();
		const question = await createQuestion('Should I take the job?');
		await setRecommendedModels(question.id, [eisenhower!.id]);

		render(Page);

		const link = await screen.findByText('Should I take the job?');
		const item = link.closest('li') as HTMLElement;
		expect(await within(item).findByText('Eisenhower Matrix')).toBeTruthy();
	});

	it('shows no badges for a question with no recommendations yet', async () => {
		await syncSeedModels();
		await createQuestion('Should I take the job?');

		render(Page);

		const link = await screen.findByText('Should I take the job?');
		const item = link.closest('li') as HTMLElement;
		expect(item.querySelectorAll('span').length).toBe(0);
	});
});
