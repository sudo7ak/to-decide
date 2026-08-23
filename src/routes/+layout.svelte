<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="min-h-screen bg-bg font-sans text-ink">
	<header class="no-print border-b border-border">
		<nav class="mx-auto flex max-w-4xl items-center gap-6 px-6 py-4">
			<a href="/" class="flex items-center gap-2 text-lg font-semibold text-ink">
				<svg width="28" height="28" viewBox="0 0 28 28" class="shrink-0 text-accent" aria-hidden="true">
					<circle cx="14" cy="14" r="12.5" fill="none" stroke="currentColor" stroke-width="1" />
					<text
						x="14"
						y="18.5"
						text-anchor="middle"
						font-family="Fraunces, serif"
						font-style="italic"
						font-weight="500"
						font-size="12"
						fill="currentColor">td</text
					>
				</svg>
				<span class="font-display">to-decide</span>
			</a>
			<a href="/models" class="text-sm text-ink-muted transition-colors hover:text-accent">
				Model Library
			</a>
		</nav>
	</header>
	{@render children()}
</div>
