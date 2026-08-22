<script lang="ts">
	import { scalePoint } from 'd3-scale';
	import type { FreeformNarrativeData } from '$lib/types';

	let { data }: { data: FreeformNarrativeData } = $props();

	const chartWidth = 480;
	const arcHeight = 24;
	const baselineY = 40;
	const nodeRadius = 8;
	const viewBoxHeight = baselineY + nodeRadius + 8;

	const xScale = $derived(
		scalePoint()
			.domain(data.sections.map((_, i) => String(i)))
			.range([32, chartWidth - 32])
	);

	function arcPath(x1: number, x2: number) {
		return `M ${x1} ${baselineY} A ${(x2 - x1) / 2} ${arcHeight} 0 0 1 ${x2} ${baselineY}`;
	}
</script>

<figure>
	<svg
		viewBox="0 0 {chartWidth} {viewBoxHeight}"
		role="img"
		aria-label="Throughline of {data.sections.length} sections"
	>
		{#each data.sections as section, i (section.heading)}
			{#if i > 0}
				{@const x1 = xScale(String(i - 1)) ?? 0}
				{@const x2 = xScale(String(i)) ?? 0}
				<path d={arcPath(x1, x2)} class="narrative-arc" fill="none" />
			{/if}
		{/each}
		{#each data.sections as section, i (section.heading)}
			{@const x = xScale(String(i)) ?? 0}
			<circle cx={x} cy={baselineY} r={nodeRadius} class="narrative-node" />
			<text x={x} y={baselineY} dy="0.35em" text-anchor="middle" class="node-number">
				{i + 1}
			</text>
		{/each}
	</svg>

	<div class="sections">
		{#each data.sections as section, i (section.heading)}
			<section>
				<h3><span class="heading-number">{i + 1}</span>{section.heading}</h3>
				<p>{section.body}</p>
			</section>
		{/each}
	</div>
	<figcaption>{data.summary}</figcaption>
</figure>

<style>
	svg {
		max-width: 100%;
		height: auto;
		display: block;
	}
	.narrative-arc {
		stroke: var(--chart-box-stroke, #cbd5e1);
		stroke-width: 1.5;
	}
	.narrative-node {
		fill: var(--chart-accent, #0f172a);
	}
	.node-number {
		font-size: 11px;
		font-weight: 600;
		fill: white;
	}
	.sections {
		margin-top: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--chart-text, #0f172a);
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.heading-number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 999px;
		background: var(--chart-accent, #0f172a);
		color: white;
		font-size: 0.6875rem;
		flex-shrink: 0;
	}
	p {
		font-size: 0.875rem;
		color: var(--chart-text-muted, #475569);
		margin: 0.25rem 0 0;
	}
	figcaption {
		margin-top: 0.75rem;
		font-size: 0.875rem;
		color: var(--chart-text-muted, #64748b);
	}
</style>
