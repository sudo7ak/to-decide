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

describe('RadarChart', () => {
	it('renders each factor label', () => {
		render(RadarChart, { data });
		expect(screen.getByText('Physical')).toBeTruthy();
		expect(screen.getByText('Emotional')).toBeTruthy();
		expect(screen.getByText('Mental')).toBeTruthy();
		expect(screen.getByText('Spiritual')).toBeTruthy();
	});

	it('renders a polygon connecting the scores', () => {
		const { container } = render(RadarChart, { data });
		expect(container.querySelector('svg polygon.radar-shape')).toBeTruthy();
	});

	it('renders one spoke line per factor', () => {
		const { container } = render(RadarChart, { data });
		const spokes = container.querySelectorAll('svg line.radar-spoke');
		expect(spokes.length).toBe(4);
	});
});
