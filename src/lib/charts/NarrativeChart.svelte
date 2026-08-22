<script lang="ts">
	import type { FreeformNarrativeData, NarrativeSectionKind } from '$lib/types';

	let { data }: { data: FreeformNarrativeData } = $props();

	// The rhetorical role each section plays in the narrative arc. Grounded in
	// the actual shape of the 13 models this chart renders: nearly every one
	// opens by naming a situation or tension, digs into the mechanism behind
	// it (an insight), and closes on what that means going forward (an
	// implication). Encoding that role — instead of a meaningless arc/dot
	// sequence — is the whole point of this redesign.
	const KIND_META: Record<NarrativeSectionKind, { label: string }> = {
		situation: { label: 'Situation' },
		tension: { label: 'Tension' },
		insight: { label: 'Insight' },
		implication: { label: 'Implication' }
	};
	const KNOWN_KINDS = new Set(Object.keys(KIND_META));

	function isKnownKind(kind: unknown): kind is NarrativeSectionKind {
		return typeof kind === 'string' && KNOWN_KINDS.has(kind);
	}

	// Older/malformed results may not carry `kind` at all (saved before this
	// field existed, or produced by a model that skipped it). Rather than show
	// a half-coded rail with blank chips, fall back to a plain numbered list —
	// still real content, just without the role coding.
	const allKinded = $derived(data.sections.every((section) => isKnownKind(section.kind)));
</script>

{#snippet kindIcon(kind: NarrativeSectionKind)}
	{#if kind === 'situation'}
		<svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
			<circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5" />
		</svg>
	{:else if kind === 'tension'}
		<svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
			<path d="M7.5 1 3 8h3.3L5.5 13l5.5-7H7.8z" fill="currentColor" />
		</svg>
	{:else if kind === 'insight'}
		<svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
			<circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" stroke-width="1.5" />
			<line
				x1="9.1"
				y1="9.1"
				x2="12.5"
				y2="12.5"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
			/>
		</svg>
	{:else}
		<svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
			<line x1="1.5" y1="7" x2="9.5" y2="7" stroke="currentColor" stroke-width="1.5" />
			<path
				d="M6.5 3.3 10.5 7l-4 3.7"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}
{/snippet}

<figure>
	{#if allKinded}
		<ol class="kind-rail" aria-hidden="true">
			{#each data.sections as section, i (section.heading)}
				{#if i > 0}
					<li class="connector">&rarr;</li>
				{/if}
				<li class="kind-chip" data-kind={section.kind}>
					{@render kindIcon(section.kind as NarrativeSectionKind)}
					<span>{KIND_META[section.kind as NarrativeSectionKind].label}</span>
				</li>
			{/each}
		</ol>
	{/if}

	<div class="sections">
		{#each data.sections as section, i (section.heading)}
			<section data-kind={allKinded ? section.kind : undefined}>
				<div class="section-head">
					{#if allKinded}
						<span class="kind-badge" data-kind={section.kind}>
							{@render kindIcon(section.kind as NarrativeSectionKind)}
							{KIND_META[section.kind as NarrativeSectionKind].label}
						</span>
					{:else}
						<span class="heading-number">{i + 1}</span>
					{/if}
					<h3>{section.heading}</h3>
				</div>
				<p>{section.body}</p>
			</section>
		{/each}
	</div>

	<figcaption class="takeaway">
		<span class="takeaway-label">Takeaway</span>
		<p>{data.summary}</p>
	</figcaption>
</figure>

<style>
	figure {
		margin: 0;
	}
	.kind-rail {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.375rem;
		margin: 0 0 1.125rem;
		padding: 0;
		list-style: none;
	}
	.connector {
		color: var(--chart-text-muted, #94a3b8);
		font-size: 0.75rem;
	}
	.kind-chip,
	.kind-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.3125rem;
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		border-radius: 999px;
		border: 1px solid var(--chart-box-stroke, #cbd5e1);
		color: var(--chart-text-muted, #64748b);
		padding: 0.25rem 0.5rem;
		line-height: 1;
		white-space: nowrap;
	}
	.kind-badge {
		margin-bottom: 0.375rem;
	}
	/* situation: the observed baseline — lightest, outline-only treatment */
	[data-kind='situation'] {
		border-color: var(--chart-box-stroke, #cbd5e1);
		color: var(--chart-text-muted, #64748b);
	}
	/* tension: the named friction — a step darker to draw the eye */
	[data-kind='tension'] {
		border-color: var(--chart-text-muted, #94a3b8);
		color: var(--chart-text, #0f172a);
	}
	/* insight: the mechanism/realization — outlined in the accent */
	[data-kind='insight'] {
		border-color: var(--chart-accent, #0f172a);
		color: var(--chart-accent, #0f172a);
	}
	/* implication: the payoff — solid accent fill, strongest weight */
	.kind-chip[data-kind='implication'],
	.kind-badge[data-kind='implication'] {
		border-color: var(--chart-accent, #0f172a);
		background: var(--chart-accent, #0f172a);
		color: white;
	}
	.sections {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	section {
		border-left: 3px solid var(--chart-box-stroke, #e2e8f0);
		padding-left: 0.875rem;
	}
	section[data-kind='tension'] {
		border-left-color: var(--chart-text-muted, #94a3b8);
	}
	section[data-kind='insight'] {
		border-left-color: var(--chart-accent, #0f172a);
	}
	section[data-kind='implication'] {
		border-left-color: var(--chart-accent, #0f172a);
		background: color-mix(in srgb, var(--chart-accent, #0f172a) 6%, transparent);
		border-radius: 0 0.375rem 0.375rem 0;
		padding: 0.625rem 0.875rem;
	}
	.section-head {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--chart-text, #0f172a);
		margin: 0;
	}
	.heading-number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 999px;
		background: var(--chart-accent, #0f172a);
		color: white;
		font-size: 0.6875rem;
		font-weight: 600;
		flex-shrink: 0;
	}
	p {
		font-size: 0.875rem;
		color: var(--chart-text-muted, #475569);
		margin: 0.25rem 0 0;
	}
	.takeaway {
		margin-top: 1.25rem;
		border: 1px solid var(--chart-box-stroke, #e2e8f0);
		background: var(--chart-box-fill, #f8fafc);
		border-radius: 0.5rem;
		padding: 0.75rem 0.875rem;
	}
	.takeaway-label {
		display: block;
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--chart-accent, #0f172a);
	}
	.takeaway p {
		margin: 0.25rem 0 0;
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--chart-text, #0f172a);
	}
</style>
