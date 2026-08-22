import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import MatrixTableChart from './MatrixTableChart.svelte';
import type { MatrixTableData } from '$lib/types';

const data: MatrixTableData = {
	rows: [
		{ label: 'Strengths', items: ['Strong brand', 'Loyal customers'] },
		{ label: 'Weaknesses', items: ['High costs'] },
		{ label: 'Opportunities', items: ['New market'] },
		{ label: 'Threats', items: ['New competitor'] }
	],
	summary: 'Lean on brand strength to enter the new market.'
};

describe('MatrixTableChart', () => {
	it('renders all row labels', () => {
		render(MatrixTableChart, { data });
		expect(screen.getAllByText('Strengths').length).toBeGreaterThan(0);
		expect(screen.getAllByText('Weaknesses').length).toBeGreaterThan(0);
		expect(screen.getAllByText('Opportunities').length).toBeGreaterThan(0);
		expect(screen.getAllByText('Threats').length).toBeGreaterThan(0);
	});

	it('renders items within their row', () => {
		render(MatrixTableChart, { data });
		expect(screen.getByText('Strong brand')).toBeTruthy();
		expect(screen.getByText('High costs')).toBeTruthy();
	});

	it('renders one comparative bar per row, on a shared scale', () => {
		const { container } = render(MatrixTableChart, { data });
		const bars = container.querySelectorAll('svg rect.row-bar');
		expect(bars.length).toBe(4);
	});

	it('sizes bars proportionally to item count on a shared scale', () => {
		const { container } = render(MatrixTableChart, { data });
		const bars = Array.from(container.querySelectorAll('svg rect.row-bar')) as SVGRectElement[];
		const strengthsBar = bars[0]; // 2 items
		const weaknessesBar = bars[1]; // 1 item
		const strengthsWidth = Number(strengthsBar.getAttribute('width'));
		const weaknessesWidth = Number(weaknessesBar.getAttribute('width'));
		expect(strengthsWidth).toBeGreaterThan(weaknessesWidth);
	});

	it('renders a count label per row', () => {
		const { container } = render(MatrixTableChart, { data });
		const labels = Array.from(container.querySelectorAll('svg text.row-count')).map(
			(el) => el.textContent
		);
		expect(labels).toEqual(['2', '1', '1', '1']);
	});

	it('renders x-axis gridlines shared across all bars', () => {
		const { container } = render(MatrixTableChart, { data });
		expect(container.querySelectorAll('svg line.grid-line').length).toBeGreaterThan(0);
	});
});
