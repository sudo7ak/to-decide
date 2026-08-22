<script lang="ts">
	import { scalePoint } from 'd3-scale';
	import { line as d3Line } from 'd3-shape';
	import type { FlowDiagramData } from '$lib/types';

	let { data }: { data: FlowDiagramData } = $props();

	const width = 640;
	const nodeY = 40;
	const nodeRadius = 10;

	const sorted = $derived([...data.steps].sort((a, b) => a.order - b.order));

	const xScale = $derived(
		scalePoint()
			.domain(sorted.map((step) => String(step.order)))
			.range([40, width - 40])
	);

	const points = $derived(sorted.map((step) => [xScale(String(step.order)) ?? 0, nodeY] as const));

	const pathD = $derived(
		d3Line<(typeof points)[number]>()
			.x((p) => p[0])
			.y((p) => p[1])(points) ?? ''
	);
</script>

<figure>
	<svg viewBox="0 0 {width} 80" role="img" aria-label="Flow of {sorted.length} steps">
		<path d={pathD} class="connector" fill="none" />
		{#each sorted as step, i (step.order)}
			<g transform="translate({points[i][0]}, {nodeY})">
				<circle class="step-node" r={nodeRadius} />
				<text y={-18} text-anchor="middle" class="step-order">{step.order}</text>
			</g>
		{/each}
	</svg>
	<ol>
		{#each sorted as step (step.order)}
			<li>
				<h3>{step.title}</h3>
				<p>{step.description}</p>
			</li>
		{/each}
	</ol>
	<figcaption>{data.summary}</figcaption>
</figure>

<style>
	svg {
		max-width: 100%;
		height: auto;
		display: block;
	}
	.connector {
		stroke: var(--chart-box-stroke, #cbd5e1);
		stroke-width: 2;
	}
	.step-node {
		fill: var(--chart-accent, #0f172a);
	}
	.step-order {
		font-size: 12px;
		font-weight: 600;
		fill: var(--chart-text-muted, #64748b);
	}
	ol {
		list-style: none;
		margin: 1rem 0 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 0.75rem;
	}
	h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--chart-text, #0f172a);
		margin: 0;
	}
	p {
		font-size: 0.8125rem;
		color: var(--chart-text-muted, #475569);
		margin: 0.25rem 0 0;
	}
	figcaption {
		margin-top: 0.75rem;
		font-size: 0.875rem;
		color: var(--chart-text-muted, #64748b);
	}
</style>
