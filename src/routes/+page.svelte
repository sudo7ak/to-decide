<script lang="ts">
	import { onMount } from 'svelte';
	import { createQuestion, listQuestions } from '$lib/stores/questions';
	import type { Question } from '$lib/types';

	let questionText = $state('');
	let questions = $state<Question[]>([]);

	async function refresh() {
		questions = await listQuestions();
	}

	async function submit() {
		if (!questionText.trim()) return;
		await createQuestion(questionText);
		questionText = '';
		await refresh();
	}

	onMount(refresh);
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
			<li>
				<a href={`/question/${question.id}`} class="block py-4 text-ink hover:text-accent">
					{question.text}
				</a>
			</li>
		{/each}
	</ul>

	{#if questions.length === 0}
		<p class="mt-12 text-ink-muted">No questions yet.</p>
	{/if}
</main>
