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

	it('keeps arcs fully inside the viewBox even with only 2 widely-spaced sections', () => {
		// Regression test: arc height used to scale with the distance between
		// nodes (height = spacing * 0.5). With only 2 sections the nodes sit
		// maximally far apart, which used to push the arc's peak far above the
		// fixed-height viewBox — clipping almost the entire arc to invisible.
		const { container } = render(NarrativeChart, {
			data: { ...data, sections: data.sections.slice(0, 2) }
		});
		const svg = container.querySelector('svg');
		const viewBoxHeight = Number(svg?.getAttribute('viewBox')?.split(' ')[3]);
		const arc = container.querySelector('path.narrative-arc');
		const d = arc?.getAttribute('d') ?? '';
		// path format: "M x1 y1 A rx ry 0 0 1 x2 y2" — ry is the arc's peak height above baseline
		const ry = Number(d.split(' ')[5]);
		const baselineY = Number(d.split(' ')[2]);
		expect(ry).toBeGreaterThan(0);
		expect(baselineY - ry).toBeGreaterThanOrEqual(0); // peak must not go above the viewBox top
		expect(baselineY - ry).toBeLessThan(viewBoxHeight);
	});
});
