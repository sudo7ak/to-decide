import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import NarrativeChart from './NarrativeChart.svelte';
import type { FreeformNarrativeData } from '$lib/types';

const data: FreeformNarrativeData = {
	sections: [
		{
			heading: 'The Conflicting Beliefs',
			body: 'You value stability but crave the new job.',
			kind: 'tension'
		},
		{
			heading: 'The Rationalization at Work',
			body: 'Telling yourself the timing is wrong.',
			kind: 'insight'
		},
		{
			heading: 'What Resolving It Would Require',
			body: 'Naming the actual fear directly.',
			kind: 'implication'
		}
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

	it('renders the takeaway summary', () => {
		render(NarrativeChart, { data });
		expect(screen.getByText('Takeaway')).toBeTruthy();
		expect(screen.getByText('The discomfort is doing useful work here.')).toBeTruthy();
	});

	it('labels each section with its kind', () => {
		const { container } = render(NarrativeChart, { data });
		const badges = Array.from(container.querySelectorAll('.kind-badge')).map((el) =>
			el.textContent?.trim()
		);
		expect(badges).toEqual(['Tension', 'Insight', 'Implication']);
	});

	it('renders one kind-coded rail chip per section, in order', () => {
		const { container } = render(NarrativeChart, { data });
		const chips = Array.from(container.querySelectorAll('.kind-chip')).map(
			(el) => el.getAttribute('data-kind')
		);
		expect(chips).toEqual(['tension', 'insight', 'implication']);
	});

	it('connects rail chips with a connector between consecutive sections', () => {
		const { container } = render(NarrativeChart, { data });
		const connectors = container.querySelectorAll('.kind-rail .connector');
		expect(connectors.length).toBe(2); // n-1 connections for n sections
	});

	it('colors each section by its kind via a data-kind attribute', () => {
		const { container } = render(NarrativeChart, { data });
		const sectionEls = container.querySelectorAll('.sections > section');
		const kinds = Array.from(sectionEls).map((el) => el.getAttribute('data-kind'));
		expect(kinds).toEqual(['tension', 'insight', 'implication']);
	});

	it('falls back to a plain numbered list when sections have no kind', () => {
		const unkinded: FreeformNarrativeData = {
			sections: data.sections.map(({ heading, body }) => ({ heading, body })),
			summary: data.summary
		};
		const { container } = render(NarrativeChart, { data: unkinded });
		expect(container.querySelector('.kind-rail')).toBeNull();
		expect(container.querySelectorAll('.kind-badge').length).toBe(0);
		const numbers = Array.from(container.querySelectorAll('.heading-number')).map(
			(el) => el.textContent
		);
		expect(numbers).toEqual(['1', '2', '3']);
	});

	it('falls back to the plain numbered list when only some sections have a kind', () => {
		const partiallyKinded: FreeformNarrativeData = {
			sections: [
				data.sections[0],
				{ heading: data.sections[1].heading, body: data.sections[1].body }
			],
			summary: data.summary
		};
		const { container } = render(NarrativeChart, { data: partiallyKinded });
		expect(container.querySelector('.kind-rail')).toBeNull();
		expect(container.querySelectorAll('.kind-badge').length).toBe(0);
	});
});
