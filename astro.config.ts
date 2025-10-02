import { vitePreprocess } from '@astrojs/svelte';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { IAmASurgeonPlugin } from 'i-am-a-surgeon';

const prod = process.env.NODE_ENV === 'production';

// https://astro.build/config
export default defineConfig({
	devToolbar: { enabled: false },

	integrations: [
		svelte({
			preprocess: vitePreprocess()
		}),
		prod &&
			IAmASurgeonPlugin({
				compressFileNames: false,
				compressCssVariables: {
					enabled: false
				}
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
