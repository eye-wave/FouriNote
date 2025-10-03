import { vitePreprocess } from '@astrojs/svelte';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

const prod = process.env.NODE_ENV === 'production';

// https://astro.build/config
export default defineConfig({
	devToolbar: { enabled: false },

	site: 'https://eye-wave.github.io',
	base: '/FouriNote',

	integrations: [
		svelte({
			preprocess: vitePreprocess()
		})
	],

	vite: {
		esbuild: {
			drop: prod ? ['console', 'debugger'] : []
		},
		server: {
			fs: {
				allow: ['src', 'pkg', 'node_modules']
			}
		},
		resolve: {
			alias: {
				$lib: '/src/lib',
				$wasm: '/pkg'
			}
		},
		plugins: [tailwindcss()]
	}
});
