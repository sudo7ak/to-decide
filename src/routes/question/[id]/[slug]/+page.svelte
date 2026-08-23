<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getQuestion } from '$lib/stores/questions';
	import { getModelBySlug } from '$lib/stores/models';
	import { createAnalysis, listAnalysesForQuestionAndModel } from '$lib/stores/analyses';
	import { chartComponents } from '$lib/charts/registry';
	import type { Analysis, ModelDef, Question } from '$lib/types';

	let question = $state<Question | undefined>(undefined);
	let model = $state<ModelDef | undefined>(undefined);
	let notFound = $state(false);
	let analyses = $state<Analysis[]>([]);
	let activeAnalysisId = $state<string | null>(null);
	let loading = $state(false);
	let error = $state(false);

	onMount(async () => {
		const { id, slug } = page.params;
		if (!id || !slug) return;
		question = await getQuestion(id);
		model = await getModelBySlug(slug);
		notFound = question === undefined || model === undefined;
		if (question && model) {
			analyses = await listAnalysesForQuestionAndModel(question.id, model.id);
			if (analyses.length > 0) {
				activeAnalysisId = analyses[0].id;
			}
		}
	});

	let activeAnalysis = $derived(analyses.find((a) => a.id === activeAnalysisId));
	let ActiveChart = $derived(
		model ? chartComponents[model.chartComponent as keyof typeof chartComponents] : undefined
	);

	function formatTimestamp(iso: string): string {
		return new Date(iso).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	async function runAnalysis() {
		if (!question || !model) return;
		loading = true;
		error = false;
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
			analyses = [created, ...analyses];
			activeAnalysisId = created.id;
		} catch {
			error = true;
		} finally {
			loading = false;
		}
	}
</script>

<main class="mx-auto max-w-2xl px-6 py-16">
	{#if question && model}
		<a href={`/question/${question.id}`} class="text-sm text-slate-400 hover:text-slate-600">
			&larr; Back to question
		</a>
		<p class="mt-4 text-sm text-slate-500">{question.text}</p>
		<h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{model.name}</h1>

		<div class="mt-6 border-t border-slate-100 pt-6">
			{#if analyses.length === 0}
				<button
					type="button"
					class="rounded bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
					disabled={loading}
					onclick={runAnalysis}
				>
					{loading ? 'Analyzing…' : 'Analyze'}
				</button>
			{:else}
				<div class="flex flex-wrap gap-2 text-xs">
					{#each analyses as run (run.id)}
						<button
							type="button"
							class={activeAnalysisId === run.id
								? 'font-semibold text-slate-900'
								: 'text-slate-400 hover:text-slate-600'}
							onclick={() => (activeAnalysisId = run.id)}
						>
							{formatTimestamp(run.createdAt)}
						</button>
					{/each}
				</div>

				{#if ActiveChart && activeAnalysis}
					<div class="mt-3">
						<ActiveChart data={activeAnalysis.resultJson as never} />
					</div>
				{/if}

				<button
					type="button"
					class="mt-3 rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
					disabled={loading}
					onclick={runAnalysis}
				>
					{loading ? 'Analyzing…' : 'Re-analyze'}
				</button>
			{/if}

			{#if error}
				<p class="mt-2 text-sm text-red-600">
					Analysis failed.
					<button type="button" class="underline" onclick={runAnalysis}>Try again</button>
				</p>
			{/if}
		</div>
	{:else if notFound}
		<p class="mt-4 text-slate-500">Question or model not found.</p>
	{/if}
</main>
