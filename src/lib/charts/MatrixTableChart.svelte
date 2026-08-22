<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { max } from 'd3-array';
	import type { MatrixTableData } from '$lib/types';

	let { data }: { data: MatrixTableData } = $props();

	const barWidth = 160;
	const barHeight = 14;

	const maxItems = $derived(max(data.rows, (row) => row.items.length) ?? 1);

	const widthScale = $derived(scaleLinear().domain([0, maxItems]).range([4, barWidth]).clamp(true));
</script>

<figure>
	<div class="rows">
		{#each data.rows as row (row.label)}
			<div class="row">
				<div class="row-header">
					<h3>{row.label}</h3>
					<svg width={barWidth} height={barHeight} role="img" aria-label="{row.label} item count">
						<rect
							class="row-bar"
							width={widthScale(row.items.length)}
							height={barHeight}
							rx={3}
						/>
					</svg>
				</div>
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
	.rows {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}
	.row {
		border: 1px solid var(--chart-box-stroke, #cbd5e1);
		border-radius: 0.5rem;
		padding: 0.75rem;
	}
	.row-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--chart-text, #0f172a);
		margin: 0;
	}
	.row-bar {
		fill: var(--chart-accent, #0f172a);
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
