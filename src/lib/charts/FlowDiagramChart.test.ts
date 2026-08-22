import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import FlowDiagramChart from './FlowDiagramChart.svelte';
import type { FlowDiagramData } from '$lib/types';

const data: FlowDiagramData = {
	steps: [
		{ order: 1, title: 'Goal', description: 'Define what success looks like.' },
		{ order: 2, title: 'Reality', description: 'Assess where things stand today.' },
		{ order: 3, title: 'Options', description: 'List possible paths forward.' },
		{ order: 4, title: 'Will', description: 'Commit to the next concrete action.' }
	],
	summary: 'Move from Goal to a committed next action.'
};

describe('FlowDiagramChart', () => {
	it('renders each step title in order', () => {
		const { container } = render(FlowDiagramChart, { data });
		const titles = Array.from(container.querySelectorAll('h3')).map((el) => el.textContent);
		expect(titles).toEqual(['Goal', 'Reality', 'Options', 'Will']);
	});

	it('renders a node per step', () => {
		const { container } = render(FlowDiagramChart, { data });
		const nodes = container.querySelectorAll('svg circle.step-node');
		expect(nodes.length).toBe(4);
	});

	it('renders step descriptions', () => {
		render(FlowDiagramChart, { data });
		expect(screen.getByText('Define what success looks like.')).toBeTruthy();
	});
});
