import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { db } from '$lib/db';
import Page from './+page.svelte';

describe('/ page', () => {
	beforeEach(async () => {
		await db.questions.clear();
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
});
