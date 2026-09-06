<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import type { RadarData } from '$lib/types';

	let { data }: { data: RadarData } = $props();

	const size = 320;
	const center = size / 2;
	const radius = size / 2 - 48;

	// The scoring ceiling comes from the data, not a hardcoded constant — a model
	// that doesn't use the common 0–10 self-rating convention can say so via
	// `maxScore`; everything else (rings, spokes, points) scales off it.
	const maxScore = $derived(data.maxScore ?? 10);
	const radiusScale = $derived(scaleLinear().domain([0, maxScore]).range([0, radius]));

	const factorCount = $derived(data.factors.length);

	function angleFor(index: number, total: number) {
		return (2 * Math.PI * index) / total - Math.PI / 2;
	}

	function pointFor(index: number, total: number, value: number, scale: (v: number) => number) {
		const angle = angleFor(index, total);
		const r = scale(value);
		return {
			x: center + r * Math.cos(angle),
			y: center + r * Math.sin(angle)
		};
	}

	// Five evenly-spaced rings (2/4/6/8/10 on the default 0–10 scale), each
	// carrying its own numeric label — without this a reader has no way to tell
	// what score any point on the shape actually represents.
	const tickCount = 5;
	const ticks = $derived(
		Array.from({ length: tickCount }, (_, i) => (maxScore * (i + 1)) / tickCount)
	);
	function formatTick(value: number) {
		return Number.isInteger(value) ? String(value) : value.toFixed(1);
	}

	// Rings are drawn as straight-edged polygons through each axis, not circles —
	// that's what makes the "6" ring actually pass through the point on every
	// spoke where a score of 6 would be plotted. It also means a 3-factor model
	// (e.g. the Project Management Triangle) gets concentric triangles, which is
	// the honest shape for three axes rather than a mismatched circular grid.
	const ringPolygons = $derived(
		ticks.map((tick) =>
			data.factors
				.map((_, i) => pointFor(i, factorCount, tick, radiusScale))
				.map((p) => `${p.x},${p.y}`)
				.join(' ')
		)
	);
	const spokes = $derived(data.factors.map((_, i) => pointFor(i, factorCount, maxScore, radiusScale)));

	const currentPoints = $derived(
		data.factors.map((factor, i) => pointFor(i, factorCount, factor.score, radiusScale))
	);
	const currentPointsAttr = $derived(currentPoints.map((p) => `${p.x},${p.y}`).join(' '));

	// The reference/target shape only renders when EVERY factor has a
	// targetScore — a partial target (some factors, not others) would draw a
	// polygon that doesn't correspond to any real "where you want to be" state.
	const hasTarget = $derived(data.factors.every((f) => f.targetScore !== undefined));
	const targetPoints = $derived(
		hasTarget
			? data.factors.map((factor, i) =>
					pointFor(i, factorCount, factor.targetScore ?? 0, radiusScale)
				)
			: []
	);
	const targetPointsAttr = $derived(targetPoints.map((p) => `${p.x},${p.y}`).join(' '));

	const labelPoints = $derived(
		data.factors.map((_, i) => pointFor(i, factorCount, maxScore + 1.6, radiusScale))
	);

	// Tick values ride the first (top) spoke, offset to its right, the way a
	// y-axis reads — the one place to look to decode "how far out is far."
	const tickLabelPoints = $derived(ticks.map((tick) => pointFor(0, factorCount, tick, radiusScale)));

	const ariaLabel = $derived(
		`Radar of ${factorCount} factors, scored 0 to ${maxScore}` +
			(hasTarget ? ', current versus target' : '')
	);
</script>

<figure>
	<svg viewBox="0 0 {size} {size}" role="img" aria-label={ariaLabel}>
		{#each ringPolygons as ring, i (ticks[i])}
			<polygon points={ring} class="radar-ring" />
		{/each}
		{#each spokes as spoke, i (data.factors[i].label)}
			<line x1={center} y1={center} x2={spoke.x} y2={spoke.y} class="radar-spoke" />
		{/each}

		{#if hasTarget}
			<!-- Amber fill shows the target zone — the "where you want to be" area -->
			<polygon points={targetPointsAttr} class="radar-shape radar-shape-gap" />
		{/if}
		<polygon points={currentPointsAttr} class="radar-shape radar-shape-current" />
		{#if hasTarget}
			<!-- Target outline drawn on top so it reads against the current fill -->
			<polygon points={targetPointsAttr} class="radar-shape radar-shape-target" />
		{/if}

		{#if hasTarget}
			{#each targetPoints as point, i (data.factors[i].label)}
				<circle cx={point.x} cy={point.y} r={3.5} class="radar-point radar-point-target" />
			{/each}
		{/if}
		{#each currentPoints as point, i (data.factors[i].label)}
			<circle cx={point.x} cy={point.y} r={3.5} class="radar-point radar-point-current" />
		{/each}

		{#each tickLabelPoints as point, i (ticks[i])}
			<text x={point.x + 6} y={point.y + 3} class="radar-tick">{formatTick(ticks[i])}</text>
		{/each}

		{#each labelPoints as label, i (data.factors[i].label)}
			<text x={label.x} y={label.y} text-anchor="middle" class="radar-label">
				{data.factors[i].label}
			</text>
		{/each}
	</svg>

	{#if hasTarget}
		<ul class="radar-legend">
			<li><span class="radar-swatch radar-swatch-current" aria-hidden="true"></span>Current</li>
			<li><span class="radar-swatch radar-swatch-target" aria-hidden="true"></span>Target</li>
		</ul>
	{/if}

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
	.radar-shape-current {
		fill: var(--chart-accent, #0f172a);
		fill-opacity: 0.15;
		stroke: var(--chart-accent, #0f172a);
		stroke-width: 2;
	}
	/* Amber "aspiration zone" — the target area rendered behind current */
	.radar-shape-gap {
		fill: #d97706;
		fill-opacity: 0.18;
		stroke: none;
	}
	.radar-shape-target {
		fill: none;
		stroke: #d97706;
		stroke-width: 2;
		stroke-dasharray: 5 4;
	}
	.radar-point-current {
		fill: var(--chart-accent, #0f172a);
	}
	.radar-point-target {
		fill: #fff7ed;
		stroke: #d97706;
		stroke-width: 1.5;
	}
	.radar-tick {
		font-size: 9px;
		font-weight: 600;
		fill: var(--chart-text-muted, #64748b);
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
	.radar-legend {
		display: flex;
		gap: 1rem;
		margin: 0.5rem 0 0;
		padding: 0;
		list-style: none;
		font-size: 0.75rem;
		color: var(--chart-text-muted, #64748b);
	}
	.radar-legend li {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.radar-swatch {
		width: 16px;
		height: 0;
		border-top-width: 2px;
		border-top-style: solid;
	}
	.radar-swatch-current {
		border-top-color: var(--chart-accent, #0f172a);
	}
	.radar-swatch-target {
		border-top-color: #d97706;
		border-top-style: dashed;
	}
	figcaption {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--chart-text-muted, #64748b);
	}
</style>
