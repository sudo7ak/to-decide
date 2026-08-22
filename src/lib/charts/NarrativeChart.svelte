<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { max } from 'd3-array';
	import type { FreeformNarrativeData } from '$lib/types';

	let { data }: { data: FreeformNarrativeData } = $props();

	const barWidth = 120;
	const barHeight = 8;

	const maxLength = $derived(max(data.sections, (section) => section.body.length) ?? 1);
	const widthScale = $derived(
		scaleLinear().domain([0, maxLength]).range([8, barWidth]).clamp(true)
	);
</script>

<figure>
	<div class="sections">
		{#each data.sections as section (section.heading)}
			<section>
				<div class="section-header">
					<h3>{section.heading}</h3>
					<svg width={barWidth} height={barHeight} role="img" aria-label="{section.heading} weight">
						<rect
							class="section-bar"
							width={widthScale(section.body.length)}
							height={barHeight}
							rx={2}
						/>
					</svg>
				</div>
				<p>{section.body}</p>
			</section>
		{/each}
	</div>
	<figcaption>{data.summary}</figcaption>
</figure>

<style>
	.sections {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}
	h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--chart-text, #0f172a);
		margin: 0;
	}
	.section-bar {
		fill: var(--chart-accent, #0f172a);
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
