<script lang="ts">
	import type { FlowDiagramData, FlowDiagramStep } from '$lib/types';

	let { data }: { data: FlowDiagramData } = $props();

	const sorted = $derived([...data.steps].sort((a, b) => a.order - b.order));

	function kindOf(step: FlowDiagramStep): 'stage' | 'gate' | 'gap' {
		return step.kind ?? 'stage';
	}

	function titleForOrder(order: number): string | undefined {
		return sorted.find((step) => step.order === order)?.title;
	}

	const loopTargets = $derived(
		new Set(sorted.filter((step) => typeof step.loopsTo === 'number').map((step) => step.loopsTo))
	);
	const hasLoop = $derived(loopTargets.size > 0);
</script>

<figure>
	<ol
		class="flow"
		aria-label="Flow of {sorted.length} steps{hasLoop ? ', including a feedback loop' : ''}"
	>
		{#each sorted as step, i (step.order)}
			{@const kind = kindOf(step)}
			{@const nextIsGap = i < sorted.length - 1 && kindOf(sorted[i + 1]) === 'gap'}
			<li class="step">
				<div class="rail">
					<span class="marker marker--{kind}" class:marker--loop-target={loopTargets.has(step.order)}>
						{#if kind === 'gate'}
							<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
								<rect x="2" y="2" width="20" height="20" rx="5" class="gate-fill" />
								<circle cx="15.5" cy="9" r="3.4" class="gate-hole" />
							</svg>
						{:else}
							<span class="marker-order">{step.order}</span>
						{/if}
					</span>
					{#if i < sorted.length - 1}
						<span class="connector" class:connector--gap={nextIsGap} aria-hidden="true"></span>
					{/if}
				</div>
				<div class="content">
					<div class="content-header">
						<h3>{step.title}</h3>
						{#if kind === 'gate'}
							<span class="badge">Defense layer</span>
						{:else if kind === 'gap'}
							<span class="badge">Discontinuity</span>
						{/if}
					</div>
					<p>{step.description}</p>
					{#if typeof step.loopsTo === 'number'}
						<p class="loop-note">
							<svg class="loop-icon" viewBox="0 0 16 16" aria-hidden="true">
								<path
									d="M3.5 3.6a5.4 5.4 0 1 1-1.1 4.9"
									fill="none"
									stroke="currentColor"
									stroke-width="1.6"
									stroke-linecap="round"
								/>
								<path
									d="M1.6 5.3 2.4 8.5l3.1-1.1"
									fill="none"
									stroke="currentColor"
									stroke-width="1.6"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
							Loops back to <strong>{titleForOrder(step.loopsTo)}</strong> (step {step.loopsTo})
						</p>
					{/if}
				</div>
			</li>
		{/each}
	</ol>
	<figcaption>{data.summary}</figcaption>
</figure>

<style>
	.flow {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.step {
		display: flex;
		gap: 0.75rem;
	}
	.step:not(:last-child) {
		padding-bottom: 1.25rem;
	}
	.rail {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex-shrink: 0;
	}
	.marker {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		flex-shrink: 0;
		background: var(--chart-accent, #0f172a);
	}
	.marker--gate {
		background: var(--chart-box-fill, #ffffff);
		border: 1.5px solid var(--chart-accent, #0f172a);
		border-radius: 8px;
	}
	.marker--loop-target {
		outline: 2px dashed var(--chart-accent, #0f172a);
		outline-offset: 3px;
	}
	.marker-order {
		font-size: 0.75rem;
		font-weight: 700;
		color: #ffffff;
	}
	.gate-fill {
		fill: var(--chart-accent, #0f172a);
	}
	.gate-hole {
		fill: var(--chart-box-fill, #ffffff);
	}
	.connector {
		width: 0;
		flex: 1;
		min-height: 1.5rem;
		border-left: 2px solid var(--chart-box-stroke, #cbd5e1);
		margin: 2px 0;
	}
	.connector--gap {
		border-left-style: dashed;
		min-height: 2.75rem;
	}
	.content {
		flex: 1;
		min-width: 0;
		padding-top: 0.125rem;
	}
	.content-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}
	h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--chart-text, #0f172a);
		margin: 0;
	}
	.badge {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		padding: 0.0625rem 0.4rem;
		border-radius: 999px;
		border: 1px solid var(--chart-box-stroke, #cbd5e1);
		color: var(--chart-text-muted, #64748b);
	}
	p {
		font-size: 0.8125rem;
		color: var(--chart-text-muted, #475569);
		margin: 0.25rem 0 0;
	}
	.loop-note {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		margin: 0.375rem 0 0;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--chart-accent, #0f172a);
	}
	.loop-icon {
		width: 13px;
		height: 13px;
		flex-shrink: 0;
		color: var(--chart-accent, #0f172a);
	}
	figcaption {
		margin-top: 1rem;
		font-size: 0.875rem;
		color: var(--chart-text-muted, #64748b);
	}
</style>
