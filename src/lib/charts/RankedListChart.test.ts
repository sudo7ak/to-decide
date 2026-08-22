import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RankedListChart from './RankedListChart.svelte';
import type { RankedListData } from '$lib/types';

const data: RankedListData = {
	items: [
		{ rank: 1, label: 'Fix onboarding flow', weight: 60, rationale: 'Drives most drop-off' },
		{ rank: 2, label: 'Add dark mode', weight: 30, rationale: 'Frequently requested' },
		{ rank: 3, label: 'Redesign footer', weight: 10, rationale: 'Low impact polish' }
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

	it('renders a rank badge with the numeric rank for each item', () => {
		const { container } = render(RankedListChart, { data });
		const badges = Array.from(container.querySelectorAll('.rank-badge')).map(
			(el) => el.textContent
		);
		expect(badges).toEqual(['1', '2', '3']);
	});

	it('never labels weight with a "%" — weight is not reliably a share of 100', () => {
		const { container } = render(RankedListChart, { data });
		expect(container.textContent).not.toContain('%');
	});

	it('shows weight against its fixed 0-100 scale, not "%"', () => {
		render(RankedListChart, { data });
		expect(screen.getByText('60')).toBeTruthy();
		expect(screen.getAllByText('/100').length).toBe(3);
	});

	it('scales bar width against a fixed 0-100 domain, not the list-local max', () => {
		const { container } = render(RankedListChart, { data });
		const bars = container.querySelectorAll('svg rect.item-bar');
		const widths = Array.from(bars).map((el) => Number(el.getAttribute('width')));
		// weight 60 vs weight 30 must render at a 2:1 width ratio (fixed domain),
		// not any ratio that would result from normalizing against the
		// in-list max of 60 (which would make the top item fill the full bar
		// regardless of how far it actually is from the 100 ceiling).
		expect(widths[0]).toBeCloseTo(widths[1] * 2, 5);
		expect(widths[0]).toBeCloseTo(widths[2] * 6, 5);
	});

	it('assigns a visual tier to each item based on weight relative to the strongest item in the list', () => {
		const { container } = render(RankedListChart, { data });
		const items = container.querySelectorAll('li');
		// weight 60 is the max in this list -> lead; weight 30 is 50% of max -> mid;
		// weight 10 is ~17% of max -> tail.
		expect(items[0].className).toContain('tier-lead');
		expect(items[1].className).toContain('tier-mid');
		expect(items[2].className).toContain('tier-tail');
	});

	it('tiers by weight, not by rank position — a lower-ranked item with the highest weight reads as the lead', () => {
		// Mirrors Maslow's Pyramid: rank encodes a fixed structural order (the
		// hierarchy level), not a priority order. The highest-urgency level
		// (rank 2, weight 50) should read as more prominent than rank 1
		// (weight 10), even though it comes second in the list.
		const maslowLike: RankedListData = {
			items: [
				{ rank: 1, label: 'Physiological', weight: 10, rationale: 'Stable right now' },
				{ rank: 2, label: 'Safety', weight: 50, rationale: 'Layoff anxiety dominating focus' },
				{ rank: 3, label: 'Belonging', weight: 15, rationale: 'Team relationships are solid' }
			],
			summary: 'The safety layer is the actual bottleneck.'
		};
		const { container } = render(RankedListChart, { data: maslowLike });
		const items = container.querySelectorAll('li');
		expect(items[0].className).toContain('tier-tail');
		expect(items[1].className).toContain('tier-lead');
		expect(items[2].className).toContain('tier-tail');
	});

	it('gives every item the same lead tier when weights are equal', () => {
		const flat: RankedListData = {
			items: [
				{ rank: 1, label: 'A', weight: 40, rationale: 'r1' },
				{ rank: 2, label: 'B', weight: 40, rationale: 'r2' }
			],
			summary: 'Both matter equally.'
		};
		const { container } = render(RankedListChart, { data: flat });
		const items = container.querySelectorAll('li');
		expect(items[0].className).toContain('tier-lead');
		expect(items[1].className).toContain('tier-lead');
	});
});
