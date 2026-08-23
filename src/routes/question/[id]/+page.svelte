<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getQuestion, setRecommendedModels } from '$lib/stores/questions';
	import { listModels } from '$lib/stores/models';
	import { listAnalysesForQuestion } from '$lib/stores/analyses';
	import type { Category, ModelDef, Question } from '$lib/types';

	const categoryLabels: Record<Category, string> = {
		'decision-making': 'Decision Making',
		'know-self': 'Knowing Yourself',
		'know-others': 'Knowing Others',
		'improve-others': 'Improving Others'
	};

	let question = $state<Question | undefined>(undefined);
	let models = $state<ModelDef[]>([]);
	let notFound = $state(false);
	let analyzedModelIds = $state<Set<string>>(new Set());
	let recommendedModelIds = $state<Set<string>>(new Set());

	onMount(async () => {
		const id = page.params.id;
		if (!id) return;
		question = await getQuestion(id);
		notFound = question === undefined;
		if (question) {
			models = await listModels();
			const analyses = await listAnalysesForQuestion(question.id);
			analyzedModelIds = new Set(analyses.map((a) => a.modelId));

			if (question.recommendedModelIds) {
				recommendedModelIds = new Set(question.recommendedModelIds);
			} else {
				fetchRecommendations(question, models);
			}
		}
	});

	async function fetchRecommendations(q: Question, allModels: ModelDef[]) {
		try {
			const res = await fetch('/api/recommend-models', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					questionText: q.text,
					models: allModels.map((m) => ({
						slug: m.slug,
						name: m.name,
						description: m.description
					}))
				})
			});
			if (!res.ok) return;
			const { modelSlugs } = (await res.json()) as { modelSlugs: string[] };
			const ids = allModels.filter((m) => modelSlugs.includes(m.slug)).map((m) => m.id);
			await setRecommendedModels(q.id, ids);
			recommendedModelIds = new Set(ids);
		} catch {
			// recommendations are a non-critical enhancement — fail silently
		}
	}

	let byCategory = $derived(
		(Object.keys(categoryLabels) as Category[]).map((category) => ({
			category,
			label: categoryLabels[category],
			models: models
				.filter((m) => m.category === category)
				.sort(
					(a, b) =>
						Number(recommendedModelIds.has(b.id)) - Number(recommendedModelIds.has(a.id))
				)
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
								href={`/question/${question.id}/${model.slug}`}
								class="block rounded-lg border border-slate-200 p-4 hover:border-slate-400"
								data-testid={`model-card-${model.slug}`}
							>
								<div class="flex items-start justify-between gap-2">
									<span class="font-medium text-slate-900">{model.name}</span>
									<div class="flex shrink-0 gap-1.5">
										{#if recommendedModelIds.has(model.id)}
											<span class="text-xs font-medium uppercase tracking-wide text-indigo-600">
												Recommended
											</span>
										{/if}
										{#if analyzedModelIds.has(model.id)}
											<span class="text-xs font-medium uppercase tracking-wide text-emerald-600">
												Analyzed
											</span>
										{/if}
									</div>
								</div>
								<p class="mt-1 text-sm text-slate-500">{model.description}</p>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	{:else if notFound}
		<p class="mt-4 text-slate-500">Question not found.</p>
	{/if}
</main>
