import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RankedListChart from './RankedListChart.svelte';
import type { RankedListData } from '$lib/types';

const data: RankedListData = {
	items: [
		{ rank: 1, label: 'Fix onboarding flow', weight: 60, rationale: 'Drives most drop-off' },
		{ rank: 2, label: 'Add dark mode', weight: 15, rationale: 'Frequently requested' },
		{ rank: 3, label: 'Redesign footer', weight: 5, rationale: 'Low impact polish' }
	],
	summary: 'Fixing onboarding alone likely drives most of the improvement.'
};

describe('RankedListChart', () => {
	it('renders each item label in rank order', () => {
		render(RankedListChart, { data });
		const labels = screen.getAllByText(/Fix onboarding flow|Add dark mode|Redesign footer/);
		expect(labels[0].textContent).toBe('Fix onboarding flow');
	});

	it('renders a bar per item sized by weight', () => {
		const { container } = render(RankedListChart, { data });
		const bars = container.querySelectorAll('svg rect.item-bar');
		expect(bars.length).toBe(3);
	});

	it('renders rationale text', () => {
		render(RankedListChart, { data });
		expect(screen.getByText('Drives most drop-off')).toBeTruthy();
	});
});
