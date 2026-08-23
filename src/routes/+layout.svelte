<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="min-h-screen bg-bg font-sans text-ink">
	<header class="border-b border-border">
		<nav class="mx-auto flex max-w-4xl items-center gap-6 px-6 py-4">
			<a href="/" class="font-display text-lg font-semibold text-ink">Decision Copilot</a>
			<a href="/models" class="text-sm text-ink-muted transition-colors hover:text-accent">
				Model Library
			</a>
		</nav>
	</header>
	{@render children()}
</div>
