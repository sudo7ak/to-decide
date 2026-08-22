import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { db } from '$lib/db';
import { syncSeedModels } from '$lib/db/seed';
import Page from './+page.svelte';

vi.mock('$app/state', () => ({
	page: { params: { slug: 'energy-model' } }
}));

describe('/models/[slug] page with a radar-rendered model', () => {
	beforeEach(async () => {
		await db.models.clear();
		await syncSeedModels();
	});

	it('renders the radar chart for a model with outputSchemaType radar', async () => {
		const { container } = render(Page);
		expect(await screen.findByText('The Energy Model')).toBeTruthy();
		expect(container.querySelector('svg polygon.radar-shape')).toBeTruthy();
	});
});
