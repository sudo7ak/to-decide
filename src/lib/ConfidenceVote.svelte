<script lang="ts">
	/**
	 * ConfidenceVote — a compact 1-to-5 star rating widget for an analysis result.
	 * Persists the user's rating via the onRate callback; the parent is responsible
	 * for writing it to the store so the component stays pure/testable.
	 */
	let {
		rating = $bindable<1 | 2 | 3 | 4 | 5 | undefined>(undefined),
		onRate
	}: {
		rating?: 1 | 2 | 3 | 4 | 5 | undefined;
		onRate: (r: 1 | 2 | 3 | 4 | 5) => void;
	} = $props();

	let hovered = $state<number | null>(null);

	const LABELS: Record<number, string> = {
		1: 'Not useful',
		2: 'Somewhat useful',
		3: 'Useful',
		4: 'Very useful',
		5: 'Spot on!'
	};

	function handleRate(r: number) {
		const v = r as 1 | 2 | 3 | 4 | 5;
		rating = v;
		onRate(v);
	}

	const activeUpTo = $derived(hovered ?? rating ?? 0);
	const feedbackLabel = $derived(
		hovered != null ? LABELS[hovered] : rating != null ? LABELS[rating] : null
	);
</script>

<div class="vote-wrap" role="group" aria-label="Rate this analysis">
	<span class="vote-prompt">Was this analysis useful?</span>
	<div class="stars">
		{#each [1, 2, 3, 4, 5] as n (n)}
			<button
				type="button"
				class="star"
				class:active={n <= activeUpTo}
				class:rated={rating != null && n <= (rating ?? 0) && hovered == null}
				aria-label="{LABELS[n]} ({n} of 5)"
				aria-pressed={rating === n}
				onmouseenter={() => (hovered = n)}
				onmouseleave={() => (hovered = null)}
				onclick={() => handleRate(n)}
			>
				<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
					<path
						d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.1l-4.94 2.6.94-5.49-4-3.9 5.53-.8z"
					/>
				</svg>
			</button>
		{/each}
	</div>
	{#if feedbackLabel}
		<span class="feedback-label" aria-live="polite">{feedbackLabel}</span>
	{/if}
	{#if rating != null}
		<span class="saved-indicator" aria-live="polite">✓ Saved</span>
	{/if}
</div>

<style>
	.vote-wrap {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--chart-box-stroke, #e2e8f0);
	}
	.vote-prompt {
		font-size: 0.8125rem;
		color: var(--chart-text-muted, #64748b);
		flex-shrink: 0;
	}
	.stars {
		display: flex;
		gap: 0.125rem;
	}
	.star {
		background: none;
		border: none;
		padding: 0.125rem;
		cursor: pointer;
		color: var(--chart-box-stroke, #cbd5e1);
		transition:
			color 0.15s,
			transform 0.1s;
		line-height: 0;
	}
	.star:hover {
		transform: scale(1.15);
	}
	.star svg path {
		fill: currentColor;
		stroke: currentColor;
		stroke-width: 1;
	}
	.star.active {
		color: #d97706;
	}
	.star.rated {
		color: #d97706;
	}
	.feedback-label {
		font-size: 0.75rem;
		color: #92400e;
		font-weight: 500;
		background: #fffbeb;
		border: 1px solid #fcd34d;
		border-radius: 999px;
		padding: 0.125rem 0.5rem;
		line-height: 1.5;
	}
	.saved-indicator {
		font-size: 0.75rem;
		color: #16a34a;
		font-weight: 600;
		margin-left: 0.25rem;
	}
</style>
