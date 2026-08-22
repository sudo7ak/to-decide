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
		expect(screen.getByText('Strengths')).toBeTruthy();
		expect(screen.getByText('Weaknesses')).toBeTruthy();
		expect(screen.getByText('Opportunities')).toBeTruthy();
		expect(screen.getByText('Threats')).toBeTruthy();
	});

	it('renders items within their row', () => {
		render(MatrixTableChart, { data });
		expect(screen.getByText('Strong brand')).toBeTruthy();
		expect(screen.getByText('High costs')).toBeTruthy();
	});

	it('renders an svg bar per row sized by item count', () => {
		const { container } = render(MatrixTableChart, { data });
		const bars = container.querySelectorAll('svg rect.row-bar');
		expect(bars.length).toBe(4);
	});
});
