import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { db } from '$lib/db';
import { seedModelsIfEmpty } from '$lib/db/seed';
import Page from './+page.svelte';

vi.mock('$app/state', () => ({
	page: { params: { slug: 'swot-analysis' } }
}));

describe('/models/[slug] page', () => {
	beforeEach(async () => {
		await db.models.clear();
		await seedModelsIfEmpty();
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
});
