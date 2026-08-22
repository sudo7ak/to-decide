<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import type { RadarData } from '$lib/types';

	let { data }: { data: RadarData } = $props();

	const size = 320;
	const center = size / 2;
	const radius = size / 2 - 48;
	const maxScore = 10;

	const radiusScale = scaleLinear().domain([0, maxScore]).range([0, radius]);

	function angleFor(index: number, total: number) {
		return (2 * Math.PI * index) / total - Math.PI / 2;
	}

	function pointFor(index: number, total: number, value: number) {
		const angle = angleFor(index, total);
		const r = radiusScale(value);
		return {
			x: center + r * Math.cos(angle),
			y: center + r * Math.sin(angle)
		};
	}

	const spokes = $derived(
		data.factors.map((factor, i) => pointFor(i, data.factors.length, maxScore))
	);
	const shapePoints = $derived(
		data.factors.map((factor, i) => pointFor(i, data.factors.length, factor.score))
	);
	const shapePointsAttr = $derived(shapePoints.map((p) => `${p.x},${p.y}`).join(' '));
	const labelPoints = $derived(
		data.factors.map((factor, i) => pointFor(i, data.factors.length, maxScore + 1.6))
	);
</script>

<figure>
	<svg viewBox="0 0 {size} {size}" role="img" aria-label="Radar of {data.factors.length} factors">
		{#each [2, 4, 6, 8, 10] as ring (ring)}
			<circle cx={center} cy={center} r={radiusScale(ring)} class="radar-ring" />
		{/each}
		{#each spokes as spoke, i (data.factors[i].label)}
			<line x1={center} y1={center} x2={spoke.x} y2={spoke.y} class="radar-spoke" />
		{/each}
		<polygon points={shapePointsAttr} class="radar-shape" />
		{#each shapePoints as point, i (data.factors[i].label)}
			<circle cx={point.x} cy={point.y} r={3.5} class="radar-point" />
		{/each}
		{#each labelPoints as label, i (data.factors[i].label)}
			<text x={label.x} y={label.y} text-anchor="middle" class="radar-label">
				{data.factors[i].label}
			</text>
		{/each}
	</svg>
	<figcaption>{data.summary}</figcaption>
</figure>

<style>
	.radar-ring {
		fill: none;
		stroke: var(--chart-box-stroke, #e2e8f0);
		stroke-width: 1;
	}
	.radar-spoke {
		stroke: var(--chart-box-stroke, #e2e8f0);
		stroke-width: 1;
	}
	.radar-shape {
		fill: var(--chart-accent, #0f172a);
		fill-opacity: 0.15;
		stroke: var(--chart-accent, #0f172a);
		stroke-width: 2;
	}
	.radar-point {
		fill: var(--chart-accent, #0f172a);
	}
	.radar-label {
		font-size: 11px;
		font-weight: 600;
		fill: var(--chart-text-muted, #64748b);
	}
	svg {
		max-width: 100%;
		height: auto;
		display: block;
	}
	figcaption {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--chart-text-muted, #64748b);
	}
</style>
