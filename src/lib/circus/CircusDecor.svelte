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
		class="circus-clown absolute bottom-2 right-4 h-12 w-12 text-accent-moss"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M12 2 L16 8 L8 8 Z"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linejoin="round"
			stroke-linecap="round"
		/>
		<line x1="7" y1="8" x2="17" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
		<circle cx="12" cy="2" r="1" fill="currentColor" />
		<circle cx="12" cy="15" r="6" stroke="currentColor" stroke-width="1.5" />
		<circle cx="9.5" cy="13.5" r="0.8" fill="currentColor" />
		<circle cx="14.5" cy="13.5" r="0.8" fill="currentColor" />
		<circle class="circus-clown-nose" cx="12" cy="16" r="1.6" />
		<path d="M9 17.5 Q12 20.5 15 17.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
	</svg>

	<svg
		class="circus-cycle text-ink"
		viewBox="0 0 36 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<circle cx="8" cy="18" r="5" stroke="currentColor" stroke-width="1.4" />
		<circle cx="28" cy="18" r="5" stroke="currentColor" stroke-width="1.4" />
		<path
			d="M8 18 L17 18 L14 9 L24 9 L28 18 M17 18 L24 9"
			stroke="currentColor"
			stroke-width="1.4"
			stroke-linejoin="round"
			stroke-linecap="round"
		/>
		<path d="M12.5 8.5 L15.5 8.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
		<path d="M24 9 L22 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
		<circle cx="17" cy="18" r="1" fill="currentColor" />
		<circle cx="20" cy="3.5" r="2" fill="currentColor" />
		<path
			d="M20 5.5 L14 8.5 M20 5.5 L22 6 M14 8.5 L17 18"
			stroke="currentColor"
			stroke-width="1.4"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
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

	.circus-clown {
		animation: circus-bounce 2.4s ease-in-out infinite;
	}

	@keyframes circus-bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-3px);
		}
	}

	.circus-cycle {
		position: absolute;
		bottom: 8px;
		left: -60px;
		width: 56px;
		animation: circus-roam 40s linear infinite;
	}

	@keyframes circus-roam {
		0% {
			transform: translateX(0);
			opacity: 0;
		}
		5% {
			opacity: 1;
		}
		45% {
			transform: translateX(calc(100vw + 60px));
			opacity: 1;
		}
		50% {
			transform: translateX(calc(100vw + 60px));
			opacity: 0;
		}
		100% {
			transform: translateX(calc(100vw + 60px));
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.circus-clown,
		.circus-cycle {
			animation: none;
		}
	}
</style>
