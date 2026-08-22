import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RadarChart from './RadarChart.svelte';
import type { RadarData } from '$lib/types';

const data: RadarData = {
	factors: [
		{ label: 'Physical', score: 7 },
		{ label: 'Emotional', score: 5 },
		{ label: 'Mental', score: 8 },
		{ label: 'Spiritual', score: 4 }
	],
	summary: 'Mental energy is strong; emotional and spiritual energy need attention.'
};

const dataWithTarget: RadarData = {
	factors: [
		{ label: 'Scope', score: 9, targetScore: 6 },
		{ label: 'Time', score: 6, targetScore: 7 },
		{ label: 'Cost', score: 4, targetScore: 7 }
	],
	summary: 'Scope pressure is past what is sustainable; Time and Cost still have room.'
};

describe('RadarChart', () => {
	it('renders each factor label', () => {
		render(RadarChart, { data });
		expect(screen.getByText('Physical')).toBeTruthy();
		expect(screen.getByText('Emotional')).toBeTruthy();
		expect(screen.getByText('Mental')).toBeTruthy();
		expect(screen.getByText('Spiritual')).toBeTruthy();
	});

	it('renders a polygon connecting the current scores', () => {
		const { container } = render(RadarChart, { data });
		expect(container.querySelector('svg polygon.radar-shape-current')).toBeTruthy();
	});

	it('renders one spoke line per factor', () => {
		const { container } = render(RadarChart, { data });
		const spokes = container.querySelectorAll('svg line.radar-spoke');
		expect(spokes.length).toBe(4);
	});

	it('renders labeled scale rings for the default 0-10 range', () => {
		const { container } = render(RadarChart, { data });
		const rings = container.querySelectorAll('svg polygon.radar-ring');
		expect(rings.length).toBe(5);
		expect(screen.getByText('2')).toBeTruthy();
		expect(screen.getByText('4')).toBeTruthy();
		expect(screen.getByText('6')).toBeTruthy();
		expect(screen.getByText('8')).toBeTruthy();
		expect(screen.getByText('10')).toBeTruthy();
	});

	it('labels each ring off a data-driven maxScore instead of a hardcoded 10', () => {
		const custom: RadarData = {
			factors: [
				{ label: 'A', score: 3 },
				{ label: 'B', score: 4 },
				{ label: 'C', score: 5 }
			],
			maxScore: 5,
			summary: 'Custom scale.'
		};
		render(RadarChart, { data: custom });
		expect(screen.getByText('1')).toBeTruthy();
		expect(screen.getByText('2')).toBeTruthy();
		expect(screen.getByText('3')).toBeTruthy();
		expect(screen.getByText('4')).toBeTruthy();
		expect(screen.getByText('5')).toBeTruthy();
		expect(screen.queryByText('10')).toBeNull();
	});

	it('does not render a target shape or legend when no factor has a targetScore', () => {
		const { container } = render(RadarChart, { data });
		expect(container.querySelector('svg polygon.radar-shape-target')).toBeNull();
		expect(container.querySelector('.radar-legend')).toBeNull();
	});

	it('renders a second shape and a legend when every factor has a targetScore', () => {
		const { container } = render(RadarChart, { data: dataWithTarget });
		expect(container.querySelector('svg polygon.radar-shape-target')).toBeTruthy();
		expect(container.querySelector('svg polygon.radar-shape-current')).toBeTruthy();
		expect(screen.getByText('Current')).toBeTruthy();
		expect(screen.getByText('Target')).toBeTruthy();
	});

	it('treats a partial targetScore (not every factor) as no target shape', () => {
		const partial: RadarData = {
			factors: [
				{ label: 'Scope', score: 9, targetScore: 6 },
				{ label: 'Time', score: 6 },
				{ label: 'Cost', score: 4 }
			],
			summary: 'Only some factors have a target.'
		};
		const { container } = render(RadarChart, { data: partial });
		expect(container.querySelector('svg polygon.radar-shape-target')).toBeNull();
		expect(container.querySelector('.radar-legend')).toBeNull();
	});

	it('renders concentric triangle rings for a 3-factor model without special-casing it', () => {
		const { container } = render(RadarChart, { data: dataWithTarget });
		const rings = container.querySelectorAll('svg polygon.radar-ring');
		expect(rings.length).toBe(5);
		for (const ring of rings) {
			const points = ring.getAttribute('points')?.trim().split(/\s+/) ?? [];
			expect(points.length).toBe(3);
		}
	});
});
