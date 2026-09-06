import adapterCloudflare from '@sveltejs/adapter-cloudflare';
import adapterStatic from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const isStaticBuild = process.env.ADAPTER === 'static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: isStaticBuild
			? adapterStatic({ fallback: 'index.html' })
			: adapterCloudflare()
	}
};

export default config;
