import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { db } from '$lib/db';
import { seedModelsIfEmpty } from '$lib/db/seed';
import Page from './+page.svelte';

describe('/models page', () => {
	beforeEach(async () => {
		await db.models.clear();
		await seedModelsIfEmpty();
	});

	it('lists all seeded models by name', async () => {
		render(Page);
		expect(await screen.findByText('Eisenhower Matrix')).toBeTruthy();
		expect(await screen.findByText('SWOT Analysis')).toBeTruthy();
		expect(await screen.findByText('SCAMPER')).toBeTruthy();
	});
});
