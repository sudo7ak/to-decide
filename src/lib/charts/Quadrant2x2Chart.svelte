<script lang="ts">
	import type { Quadrant2x2Data } from '$lib/types';

	let { data }: { data: Quadrant2x2Data } = $props();

	// Grid position is derived purely from x/y ('low' | 'high'), never from `name`.
	// This is what lets one generic chart serve 10 different models (Eisenhower,
	// BCG Box, Johari Window, Political Compass, ...) whose quadrant names and
	// even valence (which quadrant is "good") differ completely, while keeping a
	// single, consistent visual language across all of them.
	type Position = 'tr' | 'tl' | 'br' | 'bl';

	function positionOf(quadrant: Quadrant2x2Data['quadrants'][number]): Position {
		const col = quadrant.x === 'high' ? 'r' : 'l';
		const row = quadrant.y === 'high' ? 't' : 'b';
		return `${row}${col}` as Position;
	}

	function itemCountLabel(count: number) {
		return `${count} ${count === 1 ? 'item' : 'items'}`;
	}
</script>

<figure class="quadrant-chart">
	<div class="axis axis-x" aria-hidden="true">
		<span class="axis-pole">Low</span>
		<span class="axis-track"></span>
		<span class="axis-title">{data.xAxisLabel}</span>
		<span class="axis-track axis-track-arrow">
			<span class="axis-arrowhead axis-arrowhead-x"></span>
		</span>
		<span class="axis-pole">High</span>
	</div>

	<div class="body">
		<div class="axis axis-y" aria-hidden="true">
			<span class="axis-pole">High</span>
			<span class="axis-track-v axis-track-v-arrow">
				<span class="axis-arrowhead axis-arrowhead-y"></span>
			</span>
			<span class="axis-title axis-title-y">{data.yAxisLabel}</span>
			<span class="axis-track-v"></span>
			<span class="axis-pole">Low</span>
		</div>

		<div class="grid">
			{#each data.quadrants as quadrant (quadrant.name)}
				<div class="quadrant pos-{positionOf(quadrant)}">
					<div class="quadrant-header">
						<h3 class="quadrant-name">{quadrant.name}</h3>
						<span class="quadrant-count">{itemCountLabel(quadrant.items.length)}</span>
					</div>
					{#if quadrant.items.length > 0}
						<ul class="quadrant-items">
							{#each quadrant.items as item (item)}
								<li>{item}</li>
							{/each}
						</ul>
					{:else}
						<p class="quadrant-empty">No items</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<figcaption>{data.summary}</figcaption>
</figure>

<style>
	.quadrant-chart {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 640px;
	}

	/* --- Axes: a real line + single arrowhead pointing toward "high", with
	   explicit Low/High poles at each end. This replaces a rotated text label
	   with an actual direction convention (as BCG/Gartner-style quadrant charts
	   draw their axes), and it's generic because it only ever reads data.xAxisLabel
	   / data.yAxisLabel plus the literal words "Low"/"High" that the data model
	   already guarantees. --- */
	.axis {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.axis-x {
		padding-left: 3.25rem;
	}
	.axis-y {
		flex-direction: column;
		align-items: center;
		padding-bottom: 0.5rem;
	}
	.axis-pole {
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--chart-text-muted, #94a3b8);
		flex-shrink: 0;
		letter-spacing: 0.02em;
	}
	.axis-title {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--chart-text, #0f172a);
		white-space: nowrap;
		flex-shrink: 0;
	}
	/* Only the title glyph rotates — the pole labels and track stay in normal
	   horizontal flow, stacked by the flex column. Applying writing-mode to the
	   whole axis-y container (poles included) used to scramble their layout. */
	.axis-title-y {
		writing-mode: vertical-rl;
		transform: rotate(180deg);
	}
	.axis-track {
		flex: 1;
		height: 1px;
		min-width: 1rem;
		background: var(--chart-box-stroke, #cbd5e1);
		position: relative;
	}
	.axis-track-arrow {
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}
	.axis-track-v {
		flex: 1;
		width: 1px;
		min-height: 0.875rem;
		background: var(--chart-box-stroke, #cbd5e1);
	}
	.axis-track-v-arrow {
		display: flex;
		align-items: flex-start;
		justify-content: center;
	}
	.axis-arrowhead {
		width: 0;
		height: 0;
		flex-shrink: 0;
	}
	.axis-arrowhead-x {
		border-top: 4px solid transparent;
		border-bottom: 4px solid transparent;
		border-left: 6px solid var(--chart-box-stroke, #94a3b8);
	}
	.axis-arrowhead-y {
		border-left: 4px solid transparent;
		border-right: 4px solid transparent;
		border-bottom: 6px solid var(--chart-box-stroke, #94a3b8);
	}

	.body {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.75rem;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-areas: 'tl tr' 'bl br';
		gap: 0.75rem;
	}

	/* Position-based accent color, keyed only off the tl/tr/bl/br grid cell.
	   This is a stable categorical identity (so the app always tints "top-right"
	   the same way), not a claim that top-right is universally "good" or "urgent"
	   — several models here (Rumsfeld Matrix, Political Compass) have no such
	   valence at all, so the palette stays muted rather than alarm-coded. */
	.quadrant.pos-tr {
		--quad-accent: #dc2626;
		--quad-tint: #fef2f2;
	}
	.quadrant.pos-tl {
		--quad-accent: #2563eb;
		--quad-tint: #eff6ff;
	}
	.quadrant.pos-br {
		--quad-accent: #d97706;
		--quad-tint: #fffbeb;
	}
	.quadrant.pos-bl {
		--quad-accent: #64748b;
		--quad-tint: #f8fafc;
	}
	.pos-tl {
		grid-area: tl;
	}
	.pos-tr {
		grid-area: tr;
	}
	.pos-bl {
		grid-area: bl;
	}
	.pos-br {
		grid-area: br;
	}

	.quadrant {
		background: var(--chart-box-fill, #ffffff);
		border: 1px solid var(--chart-box-stroke, #e2e8f0);
		border-top: 3px solid var(--quad-accent);
		border-radius: 0.625rem;
		padding: 0.75rem 0.875rem 0.875rem;
	}
	.quadrant-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.quadrant-name {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--quad-accent);
		letter-spacing: -0.01em;
	}
	.quadrant-count {
		flex-shrink: 0;
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--quad-accent);
		background: var(--quad-tint);
		border-radius: 999px;
		padding: 0.125rem 0.5rem;
	}
	.quadrant-items {
		margin: 0.5rem 0 0;
		padding-left: 1.1rem;
		font-size: 0.8125rem;
		line-height: 1.4;
		color: var(--chart-text-muted, #475569);
	}
	.quadrant-items li + li {
		margin-top: 0.3rem;
	}
	.quadrant-empty {
		margin: 0.5rem 0 0;
		font-size: 0.8125rem;
		font-style: italic;
		color: var(--chart-text-muted, #94a3b8);
	}

	figcaption {
		margin-top: 0.25rem;
		font-size: 0.875rem;
		color: var(--chart-text-muted, #64748b);
	}
</style>
