<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { max } from 'd3-array';
	import type { RankedListData } from '$lib/types';

	let { data }: { data: RankedListData } = $props();

	const barMaxWidth = 220;
	const barHeight = 16;

	const sorted = $derived([...data.items].sort((a, b) => a.rank - b.rank));
	const maxWeight = $derived(max(data.items, (item) => item.weight) ?? 1);
	const widthScale = $derived(
		scaleLinear().domain([0, maxWeight]).range([4, barMaxWidth]).clamp(true)
	);
</script>

<figure>
	<ol>
		{#each sorted as item (item.rank)}
			<li>
				<div class="item-header">
					<span class="item-label">{item.label}</span>
					<span class="item-weight">{item.weight}%</span>
				</div>
				<svg width={barMaxWidth} height={barHeight} role="img" aria-label="{item.label} weight">
					<rect class="item-bar" width={widthScale(item.weight)} height={barHeight} rx={3} />
				</svg>
				<p class="item-rationale">{item.rationale}</p>
			</li>
		{/each}
	</ol>
	<figcaption>{data.summary}</figcaption>
</figure>

<style>
	ol {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.item-header {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--chart-text, #0f172a);
	}
	.item-bar {
		fill: var(--chart-accent, #0f172a);
	}
	.item-rationale {
		margin: 0.25rem 0 0;
		font-size: 0.8125rem;
		color: var(--chart-text-muted, #64748b);
	}
	figcaption {
		margin-top: 0.75rem;
		font-size: 0.875rem;
		color: var(--chart-text-muted, #64748b);
	}
</style>
