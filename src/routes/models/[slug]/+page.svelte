<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getModelBySlug } from '$lib/stores/models';
	import type { ModelDef } from '$lib/types';

	let model = $state<ModelDef | undefined>(undefined);
	let notFound = $state(false);

	onMount(async () => {
		const slug = page.params.slug;
		if (!slug) return;
		model = await getModelBySlug(slug);
		notFound = model === undefined;
	});
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
	{:else if notFound}
		<p class="text-slate-500">Model not found.</p>
	{/if}
</main>
