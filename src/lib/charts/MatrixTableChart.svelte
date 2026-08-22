<script lang="ts">
	import { scaleLinear, scaleBand } from 'd3-scale';
	import { max } from 'd3-array';
	import type { MatrixTableData } from '$lib/types';

	let { data }: { data: MatrixTableData } = $props();

	const margin = { top: 8, right: 32, bottom: 8, left: 128 };
	const rowHeight = 32;
	const chartWidth = 480;

	const innerWidth = chartWidth - margin.left - margin.right;
	const chartHeight = $derived(data.rows.length * rowHeight + margin.top + margin.bottom);

	const maxItems = $derived(max(data.rows, (row) => row.items.length) ?? 1);

	const xScale = $derived(
		scaleLinear()
			.domain([0, maxItems])
			.range([0, innerWidth])
			.nice()
	);

	const yScale = $derived(
		scaleBand()
			.domain(data.rows.map((row) => row.label))
			.range([0, data.rows.length * rowHeight])
			.padding(0.25)
	);

	const ticks = $derived(xScale.ticks(Math.min(maxItems, 5)));
</script>

<figure>
	<svg
		viewBox="0 0 {chartWidth} {chartHeight}"
		role="img"
		aria-label="Item count compared across {data.rows.length} rows"
	>
		<g transform="translate({margin.left}, {margin.top})">
			{#each ticks as tick (tick)}
				<line
					class="grid-line"
					x1={xScale(tick)}
					x2={xScale(tick)}
					y1={0}
					y2={data.rows.length * rowHeight}
				/>
				<text class="tick-label" x={xScale(tick)} y={data.rows.length * rowHeight + 14}>
					{tick}
				</text>
			{/each}
			{#each data.rows as row (row.label)}
				{@const barY = yScale(row.label) ?? 0}
				{@const barWidth = xScale(row.items.length)}
				<text class="row-label" x={-10} y={barY + yScale.bandwidth() / 2} dy="0.35em">
					{row.label}
				</text>
				<rect class="row-bar" x={0} y={barY} width={barWidth} height={yScale.bandwidth()} rx={3} />
				<text class="row-count" x={barWidth + 6} y={barY + yScale.bandwidth() / 2} dy="0.35em">
					{row.items.length}
				</text>
			{/each}
		</g>
	</svg>

	<div class="rows">
		{#each data.rows as row (row.label)}
			<div class="row">
				<h3>{row.label}</h3>
				<ul>
					{#each row.items as item (item)}
						<li>{item}</li>
					{/each}
				</ul>
			</div>
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
	.grid-line {
		stroke: var(--chart-box-stroke, #e2e8f0);
		stroke-width: 1;
	}
	.tick-label {
		font-size: 10px;
		fill: var(--chart-text-muted, #94a3b8);
		text-anchor: middle;
	}
	.row-label {
		font-size: 12px;
		font-weight: 600;
		fill: var(--chart-text, #0f172a);
		text-anchor: end;
	}
	.row-bar {
		fill: var(--chart-accent, #0f172a);
	}
	.row-count {
		font-size: 11px;
		font-weight: 600;
		fill: var(--chart-text-muted, #64748b);
	}
	.rows {
		margin-top: 1.25rem;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}
	.row {
		border: 1px solid var(--chart-box-stroke, #cbd5e1);
		border-radius: 0.5rem;
		padding: 0.75rem;
	}
	h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--chart-text, #0f172a);
		margin: 0;
	}
	ul {
		margin: 0.5rem 0 0;
		padding-left: 1.1rem;
		font-size: 0.875rem;
		color: var(--chart-text-muted, #475569);
	}
	figcaption {
		margin-top: 0.75rem;
		font-size: 0.875rem;
		color: var(--chart-text-muted, #64748b);
	}
</style>
