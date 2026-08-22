<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getModelBySlug } from '$lib/stores/models';
	import type { ModelDef } from '$lib/types';
	import Quadrant2x2Chart from '$lib/charts/Quadrant2x2Chart.svelte';
	import MatrixTableChart from '$lib/charts/MatrixTableChart.svelte';
	import RankedListChart from '$lib/charts/RankedListChart.svelte';
	import FlowDiagramChart from '$lib/charts/FlowDiagramChart.svelte';
	import NarrativeChart from '$lib/charts/NarrativeChart.svelte';
	import RadarChart from '$lib/charts/RadarChart.svelte';

	const chartComponents = {
		Quadrant2x2Chart,
		MatrixTableChart,
		RankedListChart,
		FlowDiagramChart,
		NarrativeChart,
		RadarChart
	};

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
		<a href="/models" class="text-sm text-slate-400 hover:text-slate-600">&larr; All models</a>
		<h1 class="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{model.name}</h1>
		<p class="mt-4 text-slate-700">{model.description}</p>

		<h2 class="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">
			When to use it
		</h2>
		<p class="mt-2 text-slate-700">{model.whenToUse}</p>

		<h2 class="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Origin</h2>
		<p class="mt-2 text-slate-700">{model.origin}</p>

		<h2 class="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">
			How to apply it
		</h2>
		<ol class="mt-2 list-decimal space-y-1 pl-5 text-slate-700">
			{#each model.howToApply as step (step)}
				<li>{step}</li>
			{/each}
		</ol>

		<div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
			<div>
				<h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Pros</h2>
				<ul class="mt-2 list-disc space-y-1 pl-5 text-slate-700">
					{#each model.pros as pro (pro)}
						<li>{pro}</li>
					{/each}
				</ul>
			</div>
			<div>
				<h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Cons</h2>
				<ul class="mt-2 list-disc space-y-1 pl-5 text-slate-700">
					{#each model.cons as con (con)}
						<li>{con}</li>
					{/each}
				</ul>
			</div>
		</div>

		<h2 class="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">
			Worked example
		</h2>
		<p class="mt-2 text-slate-700">{model.example.scenario}</p>

		{#if ExampleChart}
			<div class="mt-4">
				<!-- shape is guaranteed at runtime by chartComponent/outputSchemaType pairing in seed data, not statically knowable here -->
				<ExampleChart data={model.example.result as never} />
			</div>
		{/if}
	{:else if notFound}
		<p class="text-slate-500">Model not found.</p>
	{/if}
</main>
