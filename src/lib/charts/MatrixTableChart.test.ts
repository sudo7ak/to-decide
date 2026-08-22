import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import MatrixTableChart from './MatrixTableChart.svelte';
import type { MatrixTableData } from '$lib/types';

const swotData: MatrixTableData = {
	rows: [
		{
			label: 'Strengths',
			tone: 'positive',
			items: ['Strong brand', 'Loyal customers']
		},
		{ label: 'Weaknesses', tone: 'negative', items: ['High costs'] },
		{ label: 'Opportunities', tone: 'positive', items: ['New market'] },
		{ label: 'Threats', tone: 'negative', items: ['New competitor'] }
	],
	summary: 'Lean on brand strength to enter the new market.'
};

const neutralData: MatrixTableData = {
	rows: [
		{ label: 'Format', items: ['Written digest', 'Short video', 'Live 10-minute call'] },
		{ label: 'Frequency', items: ['Weekly', 'Biweekly'] }
	],
	summary: 'A short biweekly video is worth prototyping.'
};

const payoffData: MatrixTableData = {
	payoffGrid: {
		rowPlayerLabel: 'You',
		colPlayerLabel: 'Them',
		rowChoices: ['Share', 'Withhold'],
		colChoices: ['Share', 'Withhold'],
		cells: [
			{ rowChoice: 'Share', colChoice: 'Share', outcome: 'Mutual trust pays off.' },
			{ rowChoice: 'Share', colChoice: 'Withhold', outcome: 'Worst case for you.' },
			{ rowChoice: 'Withhold', colChoice: 'Share', outcome: 'Best case for you.' },
			{ rowChoice: 'Withhold', colChoice: 'Withhold', outcome: 'The safe default.' }
		]
	},
	summary: 'Signal cooperation cautiously before sharing anything sensitive.'
};

describe('MatrixTableChart — categorized rows', () => {
	it('renders each row label exactly once as a real table row header', () => {
		const { container } = render(MatrixTableChart, { data: swotData });
		expect(screen.getAllByText('Strengths').length).toBe(1);
		expect(screen.getAllByText('Weaknesses').length).toBe(1);
		expect(screen.getAllByText('Opportunities').length).toBe(1);
		expect(screen.getAllByText('Threats').length).toBe(1);
		expect(container.querySelectorAll('table.rows-table th[scope="row"]').length).toBe(4);
	});

	it('renders items within their row as chips, not a bullet-count bar', () => {
		const { container } = render(MatrixTableChart, { data: swotData });
		expect(screen.getByText('Strong brand')).toBeTruthy();
		expect(screen.getByText('High costs')).toBeTruthy();
		expect(container.querySelectorAll('svg rect.row-bar').length).toBe(0);
		expect(container.querySelectorAll('.chip').length).toBe(5);
	});

	it('never renders a raw item count label (the old meaningless encoding)', () => {
		render(MatrixTableChart, { data: swotData });
		expect(screen.queryByText('2 items')).toBeNull();
		expect(screen.queryByText('1 item')).toBeNull();
	});

	it('applies positive/negative tone classes so polarity is visually distinguishable', () => {
		const { container } = render(MatrixTableChart, { data: swotData });
		expect(container.querySelectorAll('tr.tone-positive').length).toBe(2);
		expect(container.querySelectorAll('tr.tone-negative').length).toBe(2);
	});

	it('rows without a tone render as neutral, not a fabricated polarity', () => {
		const { container } = render(MatrixTableChart, { data: neutralData });
		expect(container.querySelectorAll('tr.tone-neutral').length).toBe(2);
		expect(container.querySelectorAll('tr.tone-positive, tr.tone-negative').length).toBe(0);
	});

	it('renders the summary as the figure caption', () => {
		render(MatrixTableChart, { data: swotData });
		expect(screen.getByText(swotData.summary)).toBeTruthy();
	});
});

describe('MatrixTableChart — payoff matrix', () => {
	it('renders a real crosstab table with row and column choice headers', () => {
		const { container } = render(MatrixTableChart, { data: payoffData });
		const table = container.querySelector('table.payoff-table');
		expect(table).toBeTruthy();
		expect(screen.getAllByText('Share').length).toBeGreaterThanOrEqual(2);
		expect(screen.getAllByText('Withhold').length).toBeGreaterThanOrEqual(2);
	});

	it('renders exactly 4 outcome cells, one per choice combination', () => {
		const { container } = render(MatrixTableChart, { data: payoffData });
		const bodyCells = container.querySelectorAll('table.payoff-table tbody td');
		expect(bodyCells.length).toBe(4);
		expect(screen.getByText('Mutual trust pays off.')).toBeTruthy();
		expect(screen.getByText('Worst case for you.')).toBeTruthy();
		expect(screen.getByText('Best case for you.')).toBeTruthy();
		expect(screen.getByText('The safe default.')).toBeTruthy();
	});

	it('marks the two matched-choice (diagonal) cells distinctly from mismatched ones', () => {
		const { container } = render(MatrixTableChart, { data: payoffData });
		expect(container.querySelectorAll('td.matched').length).toBe(2);
	});

	it('names both players via the axis subtitle', () => {
		const { container } = render(MatrixTableChart, { data: payoffData });
		expect(container.querySelector('.axis-tag-row')?.textContent).toBe('You');
		expect(container.querySelector('.axis-tag-col')?.textContent).toBe('Them');
	});
});
