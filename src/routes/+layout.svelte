<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="min-h-screen bg-white">
	<header class="border-b border-slate-100">
		<nav class="mx-auto flex max-w-4xl items-center gap-6 px-6 py-4">
			<a href="/" class="font-semibold text-slate-900">Decision Copilot</a>
			<a href="/models" class="text-sm text-slate-500 hover:text-slate-900">Model Library</a>
		</nav>
	</header>
	{@render children()}
</div>
