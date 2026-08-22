import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import NarrativeChart from './NarrativeChart.svelte';
import type { FreeformNarrativeData } from '$lib/types';

const data: FreeformNarrativeData = {
	sections: [
		{ heading: 'The Conflicting Beliefs', body: 'You value stability but crave the new job.' },
		{ heading: 'The Rationalization at Work', body: 'Telling yourself the timing is wrong.' },
		{ heading: 'What Resolving It Would Require', body: 'Naming the actual fear directly.' }
	],
	summary: 'The discomfort is doing useful work here.'
};

describe('NarrativeChart', () => {
	it('renders each section heading', () => {
		render(NarrativeChart, { data });
		expect(screen.getByText('The Conflicting Beliefs')).toBeTruthy();
		expect(screen.getByText('The Rationalization at Work')).toBeTruthy();
		expect(screen.getByText('What Resolving It Would Require')).toBeTruthy();
	});

	it('renders each section body', () => {
		render(NarrativeChart, { data });
		expect(screen.getByText('You value stability but crave the new job.')).toBeTruthy();
	});

	it('renders one node per section along the throughline', () => {
		const { container } = render(NarrativeChart, { data });
		const nodes = container.querySelectorAll('svg circle.narrative-node');
		expect(nodes.length).toBe(3);
	});

	it('connects consecutive sections with arcs', () => {
		const { container } = render(NarrativeChart, { data });
		const arcs = container.querySelectorAll('svg path.narrative-arc');
		expect(arcs.length).toBe(2); // n-1 connections for n sections
	});

	it('labels each node with its section number', () => {
		const { container } = render(NarrativeChart, { data });
		const numbers = Array.from(container.querySelectorAll('svg text.node-number')).map(
			(el) => el.textContent
		);
		expect(numbers).toEqual(['1', '2', '3']);
	});
});
