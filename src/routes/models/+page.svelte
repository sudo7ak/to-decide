<script lang="ts">
	import { onMount } from 'svelte';
	import { listModels } from '$lib/stores/models';
	import type { Category, ModelDef } from '$lib/types';

	const categoryLabels: Record<Category, string> = {
		'decision-making': 'Decision Making',
		'know-self': 'Knowing Yourself',
		'know-others': 'Knowing Others',
		'improve-others': 'Improving Others'
	};

	let models = $state<ModelDef[]>([]);

	onMount(async () => {
		models = await listModels();
	});

	let byCategory = $derived(
		(Object.keys(categoryLabels) as Category[]).map((category) => ({
			category,
			label: categoryLabels[category],
			models: models.filter((m) => m.category === category)
		}))
	);
</script>

<main class="mx-auto max-w-4xl px-6 py-16">
	<h1 class="text-3xl font-semibold tracking-tight text-slate-900">Model Library</h1>
	<p class="mt-2 text-slate-500">Every mental model available to analyze a question.</p>

	{#each byCategory as group (group.category)}
		{#if group.models.length > 0}
			<section class="mt-10">
				<h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">
					{group.label}
				</h2>
				<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
					{#each group.models as model (model.id)}
						<a
							href={`/models/${model.slug}`}
							class="rounded-xl border border-slate-200 p-5 hover:border-slate-400"
						>
							<h3 class="font-medium text-slate-900">{model.name}</h3>
							<p class="mt-1 text-sm text-slate-500">{model.description}</p>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	{/each}
</main>
