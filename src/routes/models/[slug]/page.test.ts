import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { db } from '$lib/db';
import { syncSeedModels } from '$lib/db/seed';
import Page from './+page.svelte';

vi.mock('$app/state', () => ({
	page: { params: { slug: 'swot-analysis' } }
}));

describe('/models/[slug] page', () => {
	beforeEach(async () => {
		await db.models.clear();
		await syncSeedModels();
	});

	it('shows the model name, description, and when to use it', async () => {
		render(Page);
		expect(await screen.findByText('SWOT Analysis')).toBeTruthy();
		expect(
			await screen.findByText(
				'Breaks your question down into Strengths, Weaknesses, Opportunities and Threats.'
			)
		).toBeTruthy();
		expect(
			await screen.findByText(
				'Use when evaluating a plan, venture, or choice against both your own capabilities and the outside environment.'
			)
		).toBeTruthy();
	});

	it('shows origin, how-to-apply steps, and pros/cons', async () => {
		render(Page);
		expect(
			await screen.findByText(/Credited to Albert Humphrey/)
		).toBeTruthy();
		expect(
			await screen.findByText('Name the specific decision or venture you\'re evaluating.')
		).toBeTruthy();
		expect(
			await screen.findByText('Simple four-box structure anyone can follow without training.')
		).toBeTruthy();
		expect(
			await screen.findByText('Produces a list, not a plan — nothing tells you what to do with the four boxes.')
		).toBeTruthy();
	});

	it('shows the worked example scenario and its chart', async () => {
		const { container } = render(Page);
		expect(
			await screen.findByText('Deciding whether to leave a stable corporate job to freelance full-time.')
		).toBeTruthy();
		expect(await screen.findByText('Strengths')).toBeTruthy();
		expect(container.querySelector('svg')).toBeTruthy();
	});
});
