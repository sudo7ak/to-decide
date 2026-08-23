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
	<h1 class="font-display text-4xl font-semibold tracking-tight text-ink">Model Library</h1>
	<p class="mt-2 text-ink-muted">Every mental model available to analyze a question.</p>

	{#each byCategory as group (group.category)}
		{#if group.models.length > 0}
			<section class="mt-10">
				<h2 class="font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
					{group.label}
				</h2>
				<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
					{#each group.models as model (model.id)}
						<a
							href={`/models/${model.slug}`}
							class="rounded-xl border border-border bg-surface p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
						>
							<h3 class="font-medium text-ink">{model.name}</h3>
							<p class="mt-1 text-sm text-ink-muted">{model.description}</p>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	{/each}
</main>
