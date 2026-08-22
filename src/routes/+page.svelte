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
	<h1 class="text-3xl font-semibold tracking-tight text-slate-900">What are you deciding?</h1>
	<p class="mt-2 text-slate-500">
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
			class="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
			placeholder="What are you trying to decide?"
			bind:value={questionText}
		/>
		<button
			type="submit"
			class="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-700"
		>
			Ask
		</button>
	</form>

	<ul class="mt-12 divide-y divide-slate-200">
		{#each questions as question (question.id)}
			<li>
				<a
					href={`/question/${question.id}`}
					class="block py-4 text-slate-800 hover:text-slate-500"
				>
					{question.text}
				</a>
			</li>
		{/each}
	</ul>

	{#if questions.length === 0}
		<p class="mt-12 text-slate-400">No questions yet.</p>
	{/if}
</main>
