import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import FlowDiagramChart from './FlowDiagramChart.svelte';
import type { FlowDiagramData } from '$lib/types';

const linearData: FlowDiagramData = {
	steps: [
		{ order: 1, title: 'Goal', description: 'Define what success looks like.' },
		{ order: 2, title: 'Reality', description: 'Assess where things stand today.' },
		{ order: 3, title: 'Options', description: 'List possible paths forward.' },
		{ order: 4, title: 'Will', description: 'Commit to the next concrete action.' }
	],
	summary: 'Move from Goal to a committed next action.'
};

const nineStepData: FlowDiagramData = {
	steps: Array.from({ length: 9 }, (_, i) => ({
		order: i + 1,
		title: `Step ${i + 1}`,
		description: `Description for step ${i + 1}.`
	})),
	summary: 'A nine-step sequence.'
};

const loopingData: FlowDiagramData = {
	steps: [
		{ order: 1, title: 'The Immediate Problem', description: 'Reports miss deadlines.' },
		{
			order: 2,
			title: 'Single-Loop Fix',
			description: 'Set stricter deadlines.',
			loopsTo: 1
		},
		{ order: 3, title: 'Underlying Assumption', description: 'Priorities are unclear.' },
		{
			order: 4,
			title: 'Double-Loop Change',
			description: 'Share priorities explicitly.',
			loopsTo: 1
		}
	],
	summary: 'Fix the assumption, not just the symptom.'
};

const gateData: FlowDiagramData = {
	steps: [
		{ order: 1, title: 'Code Review', description: 'Hole: rushed review.', kind: 'gate' },
		{ order: 2, title: 'Automated Tests', description: 'Hole: missing coverage.', kind: 'gate' }
	],
	summary: 'Holes lined up.'
};

const gapData: FlowDiagramData = {
	steps: [
		{ order: 1, title: 'Innovators', description: 'Early technical adopters.' },
		{ order: 2, title: 'Early Adopters', description: 'Visionaries.' },
		{ order: 3, title: 'The Chasm', description: 'Growth stalls here.', kind: 'gap' },
		{ order: 4, title: 'Early Majority Beachhead', description: 'A narrow foothold.' }
	],
	summary: 'The stall is the chasm.'
};

describe('FlowDiagramChart', () => {
	it('renders each step title in order', () => {
		const { container } = render(FlowDiagramChart, { data: linearData });
		const titles = Array.from(container.querySelectorAll('h3')).map((el) => el.textContent);
		expect(titles).toEqual(['Goal', 'Reality', 'Options', 'Will']);
	});

	it('renders a marker per step', () => {
		const { container } = render(FlowDiagramChart, { data: linearData });
		const markers = container.querySelectorAll('.marker');
		expect(markers.length).toBe(4);
	});

	it('renders step descriptions', () => {
		render(FlowDiagramChart, { data: linearData });
		expect(screen.getByText('Define what success looks like.')).toBeTruthy();
	});

	it('does not use a fixed-width viewBox that would crowd many steps', () => {
		const { container } = render(FlowDiagramChart, { data: nineStepData });
		// The old implementation hard-coded a 640px-wide SVG for every step count.
		// The new layout must not depend on a single fixed-width container that
		// scales per-step spacing down as step count grows.
		expect(container.querySelector('svg[viewBox^="0 0 640"]')).toBeNull();
	});

	it('scales to many steps without dropping any', () => {
		const { container } = render(FlowDiagramChart, { data: nineStepData });
		const markers = container.querySelectorAll('.marker');
		expect(markers.length).toBe(9);
		const titles = Array.from(container.querySelectorAll('h3')).map((el) => el.textContent);
		expect(titles).toEqual(nineStepData.steps.map((s) => s.title));
	});

	it('renders a loop-back note for steps with loopsTo, naming the target step', () => {
		render(FlowDiagramChart, { data: loopingData });
		const notes = screen.getAllByText(/Loops back to/);
		expect(notes.length).toBe(2);
		expect(screen.getAllByText('The Immediate Problem').length).toBeGreaterThan(0);
	});

	it('marks the loop target step distinctly', () => {
		const { container } = render(FlowDiagramChart, { data: loopingData });
		const markers = container.querySelectorAll('.marker');
		expect(markers[0].classList.contains('marker--loop-target')).toBe(true);
		expect(markers[1].classList.contains('marker--loop-target')).toBe(false);
	});

	it('does not render a loop note for steps without loopsTo', () => {
		render(FlowDiagramChart, { data: linearData });
		expect(screen.queryByText(/Loops back to/)).toBeNull();
	});

	it('renders gate-kind steps with a gate marker and label', () => {
		const { container } = render(FlowDiagramChart, { data: gateData });
		expect(container.querySelectorAll('.marker--gate').length).toBe(2);
		expect(screen.getAllByText('Defense layer').length).toBe(2);
	});

	it('renders a broken connector and discontinuity label before a gap-kind step', () => {
		const { container } = render(FlowDiagramChart, { data: gapData });
		expect(container.querySelectorAll('.connector--gap').length).toBe(1);
		expect(screen.getByText('Discontinuity')).toBeTruthy();
	});

	it('renders the summary as the figcaption', () => {
		render(FlowDiagramChart, { data: linearData });
		expect(screen.getByText(linearData.summary)).toBeTruthy();
	});
});
