<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getModelBySlug } from '$lib/stores/models';
	import type { ModelDef } from '$lib/types';
	import { chartComponents } from '$lib/charts/registry';

	let model = $state<ModelDef | undefined>(undefined);
	let notFound = $state(false);

	onMount(async () => {
		const slug = page.params.slug;
		if (!slug) return;
		model = await getModelBySlug(slug);
		notFound = model === undefined;
	});

	let ExampleChart = $derived(
		model ? chartComponents[model.chartComponent as keyof typeof chartComponents] : undefined
	);
</script>

<main class="mx-auto max-w-2xl px-6 py-16">
	{#if model}
		<a href="/models" class="text-sm text-ink-muted hover:text-accent">&larr; All models</a>
		<h1 class="font-display mt-4 text-3xl font-semibold tracking-tight text-ink">{model.name}</h1>
		<p class="mt-4 text-ink">{model.description}</p>

		<h2 class="font-display mt-8 text-sm font-semibold uppercase tracking-wide text-ink-muted">
			When to use it
		</h2>
		<p class="mt-2 text-ink">{model.whenToUse}</p>

		<h2 class="font-display mt-8 text-sm font-semibold uppercase tracking-wide text-ink-muted">
			Origin
		</h2>
		<p class="mt-2 text-ink">{model.origin}</p>

		<h2 class="font-display mt-8 text-sm font-semibold uppercase tracking-wide text-ink-muted">
			How to apply it
		</h2>
		<ol class="mt-2 list-decimal space-y-1 pl-5 text-ink">
			{#each model.howToApply as step (step)}
				<li>{step}</li>
			{/each}
		</ol>

		<div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
			<div>
				<h2 class="font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
					Pros
				</h2>
				<ul class="mt-2 list-disc space-y-1 pl-5 text-ink">
					{#each model.pros as pro (pro)}
						<li>{pro}</li>
					{/each}
				</ul>
			</div>
			<div>
				<h2 class="font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
					Cons
				</h2>
				<ul class="mt-2 list-disc space-y-1 pl-5 text-ink">
					{#each model.cons as con (con)}
						<li>{con}</li>
					{/each}
				</ul>
			</div>
		</div>

		<h2 class="font-display mt-8 text-sm font-semibold uppercase tracking-wide text-ink-muted">
			Worked example
		</h2>
		<p class="mt-2 text-ink">{model.example.scenario}</p>

		{#if ExampleChart}
			<div class="mt-4 rounded-xl border border-border bg-surface p-4">
				<!-- shape is guaranteed at runtime by chartComponent/outputSchemaType pairing in seed data, not statically knowable here -->
				<ExampleChart data={model.example.result as never} />
			</div>
		{/if}
	{:else if notFound}
		<p class="text-ink-muted">Model not found.</p>
	{/if}
</main>
