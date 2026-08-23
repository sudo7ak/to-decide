<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getQuestion } from '$lib/stores/questions';
	import { listModels } from '$lib/stores/models';
	import { createAnalysis, listAnalysesForQuestionAndModel } from '$lib/stores/analyses';
	import { chartComponents } from '$lib/charts/registry';
	import type { Analysis, Category, ModelDef, Question } from '$lib/types';

	const categoryLabels: Record<Category, string> = {
		'decision-making': 'Decision Making',
		'know-self': 'Knowing Yourself',
		'know-others': 'Knowing Others',
		'improve-others': 'Improving Others'
	};

	let question = $state<Question | undefined>(undefined);
	let models = $state<ModelDef[]>([]);
	let notFound = $state(false);

	let expandedModelId = $state<string | null>(null);
	let analysesByModel = $state<Record<string, Analysis[]>>({});
	let activeAnalysisId = $state<Record<string, string>>({});
	let loadingModelId = $state<string | null>(null);
	let errorModelId = $state<string | null>(null);

	onMount(async () => {
		const id = page.params.id;
		if (!id) return;
		question = await getQuestion(id);
		notFound = question === undefined;
		models = await listModels();
	});

	let byCategory = $derived(
		(Object.keys(categoryLabels) as Category[]).map((category) => ({
			category,
			label: categoryLabels[category],
			models: models.filter((m) => m.category === category)
		}))
	);

	let expandedModel = $derived(models.find((m) => m.id === expandedModelId));
	let activeAnalysis = $derived(
		expandedModel
			? analysesByModel[expandedModel.id]?.find(
					(a) => a.id === activeAnalysisId[expandedModel.id]
				)
			: undefined
	);
	let ActiveChart = $derived(
		expandedModel
			? chartComponents[expandedModel.chartComponent as keyof typeof chartComponents]
			: undefined
	);

	function formatTimestamp(iso: string): string {
		return new Date(iso).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	async function toggleExpand(model: ModelDef) {
		if (expandedModelId === model.id) {
			expandedModelId = null;
			return;
		}
		expandedModelId = model.id;
		errorModelId = null;
		if (!analysesByModel[model.id]) {
			const list = await listAnalysesForQuestionAndModel(question!.id, model.id);
			analysesByModel = { ...analysesByModel, [model.id]: list };
			if (list.length > 0) {
				activeAnalysisId = { ...activeAnalysisId, [model.id]: list[0].id };
			}
		}
	}

	async function runAnalysis(model: ModelDef) {
		if (!question) return;
		loadingModelId = model.id;
		errorModelId = null;
		try {
			const prompt = model.promptTemplate.replaceAll('{{question}}', question.text);
			const res = await fetch('/api/analyze', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ promptTemplate: prompt, outputJsonSchema: model.outputJsonSchema })
			});
			if (!res.ok) throw new Error('analyze request failed');
			const { resultJson } = (await res.json()) as { resultJson: Record<string, unknown> };
			const created = await createAnalysis(question.id, model.id, resultJson);
			analysesByModel = {
				...analysesByModel,
				[model.id]: [created, ...(analysesByModel[model.id] ?? [])]
			};
			activeAnalysisId = { ...activeAnalysisId, [model.id]: created.id };
		} catch {
			errorModelId = model.id;
		} finally {
			loadingModelId = null;
		}
	}
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
							<div
								class="rounded-lg border border-slate-200 p-4"
								data-testid={`model-card-${model.slug}`}
							>
								<div class="flex items-start justify-between gap-2">
									<a href={`/models/${model.slug}`} class="font-medium text-slate-900 hover:underline">
										{model.name}
									</a>
									<button
										type="button"
										class="shrink-0 text-sm text-slate-500 hover:text-slate-900"
										onclick={() => toggleExpand(model)}
									>
										{expandedModelId === model.id ? 'Hide' : 'Analyze'}
									</button>
								</div>
								<p class="mt-1 text-sm text-slate-500">{model.description}</p>

								{#if expandedModelId === model.id}
									<div class="mt-4 border-t border-slate-100 pt-4">
										{#if !analysesByModel[model.id]?.length}
											<button
												type="button"
												class="rounded bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
												disabled={loadingModelId === model.id}
												onclick={() => runAnalysis(model)}
											>
												{loadingModelId === model.id ? 'Analyzing…' : 'Analyze'}
											</button>
										{:else}
											<div class="flex flex-wrap gap-2 text-xs">
												{#each analysesByModel[model.id] as run (run.id)}
													<button
														type="button"
														class={activeAnalysisId[model.id] === run.id
															? 'font-semibold text-slate-900'
															: 'text-slate-400 hover:text-slate-600'}
														onclick={() =>
															(activeAnalysisId = { ...activeAnalysisId, [model.id]: run.id })}
													>
														{formatTimestamp(run.createdAt)}
													</button>
												{/each}
											</div>

											{#if expandedModelId === model.id && ActiveChart && activeAnalysis}
												<div class="mt-3">
													<ActiveChart data={activeAnalysis.resultJson as never} />
												</div>
											{/if}

											<button
												type="button"
												class="mt-3 rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
												disabled={loadingModelId === model.id}
												onclick={() => runAnalysis(model)}
											>
												{loadingModelId === model.id ? 'Analyzing…' : 'Re-analyze'}
											</button>
										{/if}

										{#if errorModelId === model.id}
											<p class="mt-2 text-sm text-red-600">
												Analysis failed.
												<button
													type="button"
													class="underline"
													onclick={() => runAnalysis(model)}
												>
													Try again
												</button>
											</p>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	{:else if notFound}
		<p class="mt-4 text-slate-500">Question not found.</p>
	{/if}
</main>
