<script lang="ts">
	import { onMount } from 'svelte';
	import { createQuestion, listQuestions } from '$lib/stores/questions';
	import { listModels } from '$lib/stores/models';
	import { relativeTime } from '$lib/relativeTime';
	import type { Question } from '$lib/types';

	let questionText = $state('');
	let questions = $state<Question[]>([]);
	let modelNameById = $state<Record<string, string>>({});

	async function refresh() {
		questions = await listQuestions();
	}

	async function submit() {
		if (!questionText.trim()) return;
		await createQuestion(questionText);
		questionText = '';
		await refresh();
	}

	onMount(async () => {
		await refresh();
		const models = await listModels();
		modelNameById = Object.fromEntries(models.map((m) => [m.id, m.name]));
	});
</script>

<main class="mx-auto max-w-2xl px-6 py-16">
	<h1 class="font-display text-5xl font-semibold tracking-tight text-ink">
		Think it through.<br />Properly.
	</h1>
	<p class="mt-3 text-ink-muted">
		Write the question or doubt you're weighing. Then pick a model to think it through.
	</p>

	<form
		class="mt-8 flex gap-3"
		onsubmit={(e) => {
			e.preventDefault();
			submit();
		}}
	>
		<input
			class="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
			placeholder="What are you trying to decide?"
			bind:value={questionText}
		/>
		<button
			type="submit"
			class="rounded-lg bg-accent px-5 py-3 font-medium text-white transition-colors hover:bg-accent/90"
		>
			Ask
		</button>
	</form>

	<ul class="mt-12 divide-y divide-border">
		{#each questions as question (question.id)}
			<li class="py-4">
				<div class="flex items-baseline justify-between gap-4">
					<a href={`/question/${question.id}`} class="text-ink hover:text-accent">
						{question.text}
					</a>
					<span class="shrink-0 text-xs text-ink-muted">{relativeTime(question.createdAt)}</span>
				</div>
				{#if question.recommendedModelIds?.length}
					<div class="mt-2 flex flex-wrap gap-1.5">
						{#each question.recommendedModelIds as modelId (modelId)}
							{#if modelNameById[modelId]}
								<span
									class="rounded-full border border-accent/30 bg-accent/5 px-2 py-0.5 text-xs font-medium text-accent"
								>
									{modelNameById[modelId]}
								</span>
							{/if}
						{/each}
					</div>
				{/if}
			</li>
		{/each}
	</ul>

	{#if questions.length === 0}
		<p class="mt-12 text-ink-muted">No questions yet.</p>
	{/if}
</main>
