<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import type { RankedListData } from '$lib/types';

	let { data }: { data: RankedListData } = $props();

	const barMaxWidth = 200;
	const barHeight = 14;

	// `weight` is a 0-100 score on a FIXED scale (outputJsonSchema across every
	// model feeding this chart bounds it { minimum: 0, maximum: 100 }). It is
	// NOT reliably a share of a whole that sums to 100:
	// - Pareto's prompt frames it as "share of the impact", but even its own
	//   worked example is a deliberately non-exhaustive top-N list
	//   (45 + 20 + 10 = 75 — the untracked "trivial many" hold the rest).
	// - SCAMPER scores all seven lenses independently (its example sums to ~275).
	// - Choice Overload, Thinking Outside the Box, the Unimaginable Model,
	//   Cognitive Bias Checklist, and Result Optimisation all score items on
	//   their own independent strength, not a slice of a fixed pie.
	// - Maslow's five level scores are independent per-domain urgency ratings,
	//   not a 100% split across life domains.
	// So every bar reads against the fixed 0-100 scale (a meter — "how strong
	// is this signal") rather than against the other items' shares, and is
	// never labeled with a "%" suffix, which would falsely claim the set sums
	// to 100.
	const widthScale = scaleLinear().domain([0, 100]).range([0, barMaxWidth]).clamp(true);

	const sorted = $derived([...data.items].sort((a, b) => a.rank - b.rank));
	const maxWeight = $derived(Math.max(1, ...data.items.map((item) => item.weight)));

	// Visual prominence is driven by weight relative to the strongest item IN
	// THIS LIST, not by rank number. Rank is positional/sequential, not always
	// a priority order: SCAMPER always lists its seven lenses Substitute →
	// Reverse in that fixed order, and Maslow always lists its five levels
	// Physiological → Self-Actualization bottom-up. Neither is sorted by
	// weight — in Maslow's own worked example the highest-urgency item
	// (Safety, weight 50) sits at rank 2, while rank 1 (Physiological, weight
	// 10) is the least urgent. Tiering off weight instead of rank means the
	// chart foregrounds whichever item actually matters most even when it
	// isn't first in the list — the front-loaded shape Pareto and the Long
	// Tail model are literally about, without misreading a model like Maslow
	// where list order encodes structure, not importance.
	function tierOf(weight: number, max: number): 'lead' | 'mid' | 'tail' {
		const ratio = weight / max;
		if (ratio >= 0.7) return 'lead';
		if (ratio >= 0.35) return 'mid';
		return 'tail';
	}
</script>

<figure>
	<ol>
		{#each sorted as item (item.rank)}
			{@const tier = tierOf(item.weight, maxWeight)}
			<li class="tier-{tier}">
				<span class="rank-badge">{item.rank}</span>
				<div class="item-body">
					<div class="item-header">
						<span class="item-label">{item.label}</span>
						<span class="item-weight"
							>{item.weight}<span class="item-weight-scale">/100</span></span
						>
					</div>
					<svg
						width={barMaxWidth}
						height={barHeight}
						role="img"
						aria-label="{item.label}: {item.weight} out of 100"
					>
						<rect class="item-track" width={barMaxWidth} height={barHeight} rx={4} />
						<rect class="item-bar" width={widthScale(item.weight)} height={barHeight} rx={4} />
					</svg>
					<p class="item-rationale">{item.rationale}</p>
				</div>
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
		gap: 0.875rem;
	}
	li {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
		border-left: 3px solid transparent;
		padding-left: 0.625rem;
	}
	li.tier-lead {
		border-left-color: var(--chart-accent, #0f172a);
	}
	li.tier-tail {
		opacity: 0.82;
	}
	.rank-badge {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 700;
		line-height: 1;
		margin-top: 0.0625rem;
	}
	.tier-lead .rank-badge {
		background: var(--chart-accent, #0f172a);
		color: var(--chart-box-fill, #ffffff);
	}
	.tier-mid .rank-badge {
		background: var(--chart-box-fill, #ffffff);
		border: 1.5px solid var(--chart-accent, #0f172a);
		color: var(--chart-accent, #0f172a);
	}
	.tier-tail .rank-badge {
		background: var(--chart-box-fill, #ffffff);
		border: 1px solid var(--chart-box-stroke, #cbd5e1);
		color: var(--chart-text-muted, #94a3b8);
	}
	.item-body {
		flex: 1;
		min-width: 0;
	}
	.item-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.item-label {
		color: var(--chart-text, #0f172a);
	}
	.tier-lead .item-label {
		font-size: 0.9375rem;
		font-weight: 700;
	}
	.tier-mid .item-label {
		font-size: 0.875rem;
		font-weight: 600;
	}
	.tier-tail .item-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--chart-text-muted, #64748b);
	}
	.item-weight {
		flex-shrink: 0;
		font-size: 0.8125rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--chart-text, #0f172a);
	}
	.tier-tail .item-weight {
		color: var(--chart-text-muted, #94a3b8);
	}
	.item-weight-scale {
		font-weight: 500;
		color: var(--chart-text-muted, #94a3b8);
	}
	svg {
		display: block;
		margin-top: 0.3125rem;
	}
	.item-track {
		fill: var(--chart-box-stroke, #e2e8f0);
	}
	.item-bar {
		fill: var(--chart-accent, #0f172a);
	}
	.tier-mid .item-bar {
		fill-opacity: 0.7;
	}
	.tier-tail .item-bar {
		fill: var(--chart-text-muted, #94a3b8);
		fill-opacity: 0.8;
	}
	.item-rationale {
		margin: 0.25rem 0 0;
		font-size: 0.8125rem;
		color: var(--chart-text-muted, #64748b);
	}
	.tier-tail .item-rationale {
		font-size: 0.75rem;
	}
	figcaption {
		margin-top: 0.875rem;
		font-size: 0.875rem;
		color: var(--chart-text-muted, #64748b);
	}
</style>
