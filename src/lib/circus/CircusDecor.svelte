<svg
	class="circus-bunting no-print"
	viewBox="0 0 1600 14"
	preserveAspectRatio="none"
	aria-hidden="true"
>
	<defs>
		<pattern id="circus-bunting-pattern" width="16" height="14" patternUnits="userSpaceOnUse">
			<line x1="0" y1="1" x2="16" y2="1" stroke="var(--color-border)" stroke-width="1" />
			<path d="M1 1.5 L5 10.5 L9 1.5 Z" fill="var(--color-accent)" opacity="0.55" />
			<path d="M9 1.5 L13 10.5 L17 1.5 Z" fill="var(--color-accent-moss)" opacity="0.55" />
		</pattern>
	</defs>
	<rect width="1600" height="14" fill="url(#circus-bunting-pattern)" />
</svg>

<div class="no-print pointer-events-none fixed inset-x-0 bottom-0 z-0 hidden md:block" aria-hidden="true">
	<svg
		class="absolute bottom-2 left-4 h-14 w-14 text-accent"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M3 21 L7 11 L9.5 15 L12 5 L14.5 15 L17 11 L21 21 Z"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linejoin="round"
			stroke-linecap="round"
		/>
		<path d="M9.5 15 L9.5 21 M14.5 15 L14.5 21" stroke="currentColor" stroke-width="1" opacity="0.5" />
		<path d="M10 21 L12 15 L14 21" stroke="currentColor" stroke-width="1" stroke-linejoin="round" />
		<path d="M12 5 L12 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
		<path d="M12 1.5 L16 3 L12 4.5 Z" fill="currentColor" />
	</svg>

	<svg
		class="absolute bottom-2 right-4 h-12 w-12 text-accent-moss"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M12 1 L17 7.5 L7 7.5 Z"
			stroke="currentColor"
			stroke-width="1.6"
			stroke-linejoin="round"
			stroke-linecap="round"
		/>
		<line x1="6" y1="7.5" x2="18" y2="7.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
		<circle cx="12" cy="1" r="1.3" fill="currentColor" />
		<circle cx="12" cy="15" r="7" stroke="currentColor" stroke-width="1.6" />
		<circle cx="2.6" cy="13.5" r="1" fill="currentColor" />
		<circle cx="4.4" cy="10.5" r="1" fill="currentColor" />
		<circle cx="21.4" cy="13.5" r="1" fill="currentColor" />
		<circle cx="19.6" cy="10.5" r="1" fill="currentColor" />
		<circle cx="9" cy="13.5" r="1.1" fill="currentColor" />
		<circle cx="15" cy="13.5" r="1.1" fill="currentColor" />
		<circle class="circus-clown-nose" cx="12" cy="17" r="2.4" />
		<path d="M7.5 19 Q12 23.5 16.5 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
	</svg>

	<svg
		class="circus-cycle text-ink"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<circle cx="5.5" cy="17.5" r="3.5" stroke="currentColor" stroke-width="1.6" />
		<circle cx="18.5" cy="17.5" r="3.5" stroke="currentColor" stroke-width="1.6" />
		<path
			d="M5.5 17.5 L12 17.5 L9 10 L15 8 L18.5 17.5 M12 17.5 L15 8"
			stroke="currentColor"
			stroke-width="1.6"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<path d="M7.5 9.7 L10.5 10.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
		<path d="M13.5 6.7 L16.5 7.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
		<circle cx="12" cy="17.5" r="1" fill="currentColor" />
	</svg>
</div>

<style>
	.circus-bunting {
		display: block;
		width: 100%;
		height: 14px;
	}

	.circus-clown-nose {
		fill: var(--color-accent);
	}

	.circus-cycle {
		position: absolute;
		bottom: 8px;
		left: -60px;
		width: 56px;
		animation: circus-roam 70s linear infinite;
	}

	@keyframes circus-roam {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(calc(100vw + 116px));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.circus-cycle {
			animation: none;
		}
	}
</style>
