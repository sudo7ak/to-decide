<script lang="ts">
	import { scaleBand } from 'd3-scale';
	import type { Quadrant2x2Data } from '$lib/types';

	let { data }: { data: Quadrant2x2Data } = $props();

	const size = 480;
	const margin = 40;

	const xScale = scaleBand<'low' | 'high'>()
		.domain(['low', 'high'])
		.range([margin, size])
		.paddingInner(0.04);

	const yScale = scaleBand<'low' | 'high'>()
		.domain(['high', 'low'])
		.range([margin, size])
		.paddingInner(0.04);

	const boxSize = xScale.bandwidth();

	function boxFor(quadrant: Quadrant2x2Data['quadrants'][number]) {
		return {
			x: xScale(quadrant.x) ?? 0,
			y: yScale(quadrant.y) ?? 0
		};
	}
</script>

<figure>
	<svg viewBox="0 0 {size} {size}" role="img" aria-label="{data.xAxisLabel} by {data.yAxisLabel}">
		<text x={margin + (size - margin) / 2} y={16} text-anchor="middle" class="axis-label">
			{data.xAxisLabel}
		</text>
		<text
			x={12}
			y={margin + (size - margin) / 2}
			text-anchor="middle"
			class="axis-label"
			transform="rotate(-90, 12, {margin + (size - margin) / 2})"
		>
			{data.yAxisLabel}
		</text>

		{#each data.quadrants as quadrant (quadrant.name)}
			{@const box = boxFor(quadrant)}
			<g transform="translate({box.x}, {box.y})">
				<rect width={boxSize} height={boxSize} class="quadrant-box" />
				<text x={10} y={22} class="quadrant-name">{quadrant.name}</text>
				{#each quadrant.items as item, i (item)}
					<text x={10} y={42 + i * 18} class="quadrant-item">{item}</text>
				{/each}
			</g>
		{/each}
	</svg>
	<figcaption>{data.summary}</figcaption>
</figure>

<style>
	svg {
		max-width: 100%;
		height: auto;
		display: block;
	}
	.quadrant-box {
		fill: var(--chart-box-fill, #f8fafc);
		stroke: var(--chart-box-stroke, #cbd5e1);
		stroke-width: 1;
	}
	.quadrant-name {
		font-size: 14px;
		font-weight: 600;
		fill: var(--chart-text, #0f172a);
	}
	.quadrant-item {
		font-size: 12px;
		fill: var(--chart-text-muted, #475569);
	}
	.axis-label {
		font-size: 12px;
		font-weight: 600;
		fill: var(--chart-text-muted, #64748b);
	}
	figcaption {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--chart-text-muted, #64748b);
	}
</style>
