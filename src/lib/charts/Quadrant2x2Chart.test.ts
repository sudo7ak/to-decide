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

	it('renders an svg element', () => {
		const { container } = render(Quadrant2x2Chart, { data });
		expect(container.querySelector('svg')).toBeTruthy();
	});

	it('sizes boxes to their content instead of a fixed oversized square', () => {
		const sparse = render(Quadrant2x2Chart, { data });
		const sparseViewBox = sparse.container
			.querySelector('svg')
			?.getAttribute('viewBox')
			?.split(' ')
			.map(Number);

		const denseData: Quadrant2x2Data = {
			...data,
			quadrants: data.quadrants.map((q, i) =>
				i === 0 ? { ...q, items: ['One', 'Two', 'Three', 'Four', 'Five', 'Six'] } : q
			)
		};
		const dense = render(Quadrant2x2Chart, { data: denseData });
		const denseViewBox = dense.container
			.querySelector('svg')
			?.getAttribute('viewBox')
			?.split(' ')
			.map(Number);

		expect(sparseViewBox?.[3]).toBeDefined();
		expect(denseViewBox?.[3]).toBeDefined();
		// height (index 3) should grow with content, not stay fixed regardless of item count
		expect(denseViewBox![3]).toBeGreaterThan(sparseViewBox![3]);
	});
});
