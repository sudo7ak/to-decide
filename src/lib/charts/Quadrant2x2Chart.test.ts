import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Quadrant2x2Chart from './Quadrant2x2Chart.svelte';
import type { Quadrant2x2Data } from '$lib/types';

const data: Quadrant2x2Data = {
	xAxisLabel: 'Urgency',
	yAxisLabel: 'Importance',
	quadrants: [
		{ name: 'Do First', x: 'high', y: 'high', items: ['Fix production bug'] },
		{ name: 'Schedule', x: 'low', y: 'high', items: ['Plan next quarter'] },
		{ name: 'Delegate', x: 'high', y: 'low', items: ['Answer routine email'] },
		{ name: 'Eliminate', x: 'low', y: 'low', items: ['Browse social media'] }
	],
	summary: 'Focus on Do First items today.'
};

describe('Quadrant2x2Chart', () => {
	it('renders all four quadrant names', () => {
		render(Quadrant2x2Chart, { data });
		expect(screen.getByText('Do First')).toBeTruthy();
		expect(screen.getByText('Schedule')).toBeTruthy();
		expect(screen.getByText('Delegate')).toBeTruthy();
		expect(screen.getByText('Eliminate')).toBeTruthy();
	});

	it('renders axis labels', () => {
		render(Quadrant2x2Chart, { data });
		expect(screen.getByText('Urgency')).toBeTruthy();
		expect(screen.getByText('Importance')).toBeTruthy();
	});

	it('renders items within their quadrant', () => {
		render(Quadrant2x2Chart, { data });
		expect(screen.getByText('Fix production bug')).toBeTruthy();
	});

	it('renders Low/High poles for both axes, showing direction generically from the data', () => {
		render(Quadrant2x2Chart, { data });
		// one Low + one High pole per axis (x and y) = 2 of each, not hardcoded per model
		expect(screen.getAllByText('Low').length).toBe(2);
		expect(screen.getAllByText('High').length).toBe(2);
	});

	it('draws an axis track with a direction arrow for each axis (not just a rotated label)', () => {
		const { container } = render(Quadrant2x2Chart, { data });
		// one arrowhead per axis (x and y), pointing toward "high"
		expect(container.querySelectorAll('.axis-arrowhead').length).toBe(2);
		expect(container.querySelectorAll('.axis-track').length).toBeGreaterThanOrEqual(2);
	});

	it('shows an item count for each quadrant', () => {
		render(Quadrant2x2Chart, { data });
		expect(screen.getAllByText('1 item').length).toBe(4);
	});

	it('renders a friendly placeholder for a quadrant with no items, instead of an empty box', () => {
		const emptyData: Quadrant2x2Data = {
			...data,
			quadrants: data.quadrants.map((q, i) => (i === 0 ? { ...q, items: [] } : q))
		};
		render(Quadrant2x2Chart, { data: emptyData });
		expect(screen.getByText('No items')).toBeTruthy();
	});

	it('renders long item text in full, unclipped (regression: fixed-width SVG text used to overflow)', () => {
		const longItem =
			'Likely stakeholder position: favors strong top-down policy with market-friendly framing';
		const longData: Quadrant2x2Data = {
			...data,
			quadrants: data.quadrants.map((q, i) => (i === 0 ? { ...q, items: [longItem] } : q))
		};
		render(Quadrant2x2Chart, { data: longData });
		expect(screen.getByText(longItem)).toBeTruthy();
	});

	it('sizes itself to content instead of a fixed oversized box: a dense quadrant renders every item', () => {
		const denseItems = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'];
		const denseData: Quadrant2x2Data = {
			...data,
			quadrants: data.quadrants.map((q, i) => (i === 0 ? { ...q, items: denseItems } : q))
		};
		render(Quadrant2x2Chart, { data: denseData });
		for (const item of denseItems) {
			expect(screen.getByText(item)).toBeTruthy();
		}
	});

	it('colors quadrants by grid position (x/y), not by hardcoded quadrant name', () => {
		// Two different models both have a "high/high" quadrant under different names.
		// The generic component must key its position styling off x/y, never off `name`.
		const eisenhower = render(Quadrant2x2Chart, { data });
		const doFirstEl = eisenhower.getByText('Do First').closest('.quadrant');

		const bcgData: Quadrant2x2Data = {
			xAxisLabel: 'Relative Market Share',
			yAxisLabel: 'Market Growth',
			quadrants: [
				{ name: 'Star', x: 'high', y: 'high', items: ['Flagship product'] },
				{ name: 'Cash Cow', x: 'high', y: 'low', items: ['Legacy product'] },
				{ name: 'Question Mark', x: 'low', y: 'high', items: ['New bet'] },
				{ name: 'Dog', x: 'low', y: 'low', items: ['Sunsetting product'] }
			],
			summary: 'Invest in stars.'
		};
		const bcg = render(Quadrant2x2Chart, { data: bcgData });
		const starEl = bcg.getByText('Star').closest('.quadrant');

		expect(doFirstEl).toBeTruthy();
		expect(starEl).toBeTruthy();
		// Both are the x:high, y:high quadrant in their respective models — same position class.
		const doFirstPosClass = Array.from(doFirstEl!.classList).find((c) => c.startsWith('pos-'));
		const starPosClass = Array.from(starEl!.classList).find((c) => c.startsWith('pos-'));
		expect(doFirstPosClass).toBeDefined();
		expect(doFirstPosClass).toBe(starPosClass);
	});

	it('gives different-position quadrants different position classes', () => {
		const { container } = render(Quadrant2x2Chart, { data });
		const posClasses = new Set(
			Array.from(container.querySelectorAll('.quadrant')).map(
				(el) => Array.from(el.classList).find((c) => c.startsWith('pos-'))
			)
		);
		expect(posClasses.size).toBe(4);
	});

	it("renders a quadrant's guidance text when the data provides it", () => {
		const guidedData: Quadrant2x2Data = {
			...data,
			quadrants: data.quadrants.map((q, i) =>
				i === 0 ? { ...q, guidance: 'Act on this now — no gap to close.' } : q
			)
		};
		render(Quadrant2x2Chart, { data: guidedData });
		expect(screen.getByText('Act on this now — no gap to close.')).toBeTruthy();
	});

	it('omits the guidance line entirely when a quadrant has no guidance (older/partial data)', () => {
		const { container } = render(Quadrant2x2Chart, { data });
		// none of the fixture quadrants set `guidance`
		expect(container.querySelector('.quadrant-guidance')).toBeNull();
	});

	it('shows guidance even on an empty quadrant, so a 0-item cell still has real content', () => {
		const emptyWithGuidance: Quadrant2x2Data = {
			...data,
			quadrants: data.quadrants.map((q, i) =>
				i === 0 ? { ...q, items: [], guidance: 'Sustain this pairing.' } : q
			)
		};
		render(Quadrant2x2Chart, { data: emptyWithGuidance });
		expect(screen.getByText('Sustain this pairing.')).toBeTruthy();
		expect(screen.getByText('No items')).toBeTruthy();
	});
});
