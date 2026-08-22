<script lang="ts">
	import { scaleBand } from 'd3-scale';
	import { max } from 'd3-array';
	import type { Quadrant2x2Data } from '$lib/types';

	let { data }: { data: Quadrant2x2Data } = $props();

	const margin = 36;
	const gap = 10;
	const boxWidth = 220;
	const headerHeight = 30;
	const itemLineHeight = 18;
	const bottomPadding = 14;

	const maxItems = $derived(max(data.quadrants, (q) => q.items.length) ?? 0);
	const boxHeight = $derived(Math.max(70, headerHeight + maxItems * itemLineHeight + bottomPadding));

	const width = $derived(margin + boxWidth * 2 + gap);
	const height = $derived(margin + boxHeight * 2 + gap);

	const xScale = $derived(
		scaleBand<'low' | 'high'>()
			.domain(['low', 'high'])
			.range([margin, width])
			.paddingInner(gap / (boxWidth + gap))
	);

	const yScale = $derived(
		scaleBand<'low' | 'high'>()
			.domain(['high', 'low'])
			.range([margin, height])
			.paddingInner(gap / (boxHeight + gap))
	);

	function boxFor(quadrant: Quadrant2x2Data['quadrants'][number]) {
		return {
			x: xScale(quadrant.x) ?? 0,
			y: yScale(quadrant.y) ?? 0
		};
	}
</script>

<figure>
	<svg
		viewBox="0 0 {width} {height}"
		role="img"
		aria-label="{data.xAxisLabel} by {data.yAxisLabel}"
	>
		<text x={margin + (width - margin) / 2} y={16} text-anchor="middle" class="axis-label">
			{data.xAxisLabel}
		</text>
		<text
			x={12}
			y={margin + (height - margin) / 2}
			text-anchor="middle"
			class="axis-label"
			transform="rotate(-90, 12, {margin + (height - margin) / 2})"
		>
			{data.yAxisLabel}
		</text>

		{#each data.quadrants as quadrant (quadrant.name)}
			{@const box = boxFor(quadrant)}
			<g transform="translate({box.x}, {box.y})">
				<rect width={boxWidth} height={boxHeight} class="quadrant-box" />
				<text x={10} y={22} class="quadrant-name">{quadrant.name}</text>
				{#each quadrant.items as item, i (item)}
					<text x={10} y={headerHeight + 8 + i * itemLineHeight} class="quadrant-item">
						{item}
					</text>
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
