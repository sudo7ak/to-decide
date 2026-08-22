<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getQuestion } from '$lib/stores/questions';
	import { listModels } from '$lib/stores/models';
	import type { Category, ModelDef, Question } from '$lib/types';

	const categoryLabels: Record<Category, string> = {
		'decision-making': 'Decision Making',
		'know-self': 'Knowing Yourself',
		'know-others': 'Knowing Others',
		'improve-others': 'Improving Others'
	};

	let question = $state<Question | undefined>(undefined);
	let models = $state<ModelDef[]>([]);

	onMount(async () => {
		question = await getQuestion(page.params.id);
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

<main class="mx-auto max-w-2xl px-6 py-16">
	<a href="/" class="text-sm text-slate-400 hover:text-slate-600">&larr; All questions</a>

	{#if question}
		<h1 class="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{question.text}</h1>

		<h2 class="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-400">
			Pick a model
		</h2>
		{#each byCategory as group (group.category)}
			{#if group.models.length > 0}
				<div class="mt-6">
					<h3 class="text-xs font-medium uppercase tracking-wide text-slate-400">
						{group.label}
					</h3>
					<div class="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
						{#each group.models as model (model.id)}
							<a
								href={`/models/${model.slug}`}
								class="rounded-lg border border-slate-200 p-4 hover:border-slate-400"
							>
								<p class="font-medium text-slate-900">{model.name}</p>
								<p class="mt-1 text-sm text-slate-500">{model.description}</p>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	{/if}
</main>
