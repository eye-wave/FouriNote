import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

export function generateAstroPagesPlugin(): Plugin {
	const pagesDir = path.resolve(process.cwd(), 'src/pages');
	const routesDir = path.resolve(process.cwd(), 'src/routes');

	return {
		name: 'vite-plugin-generate-astro-pages',
		async buildStart() {
			if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir, { recursive: true });

			const files = fs.readdirSync(routesDir, { withFileTypes: true });

			for (const file of files) {
				const sveltePage = file.isDirectory()
					? path.join(routesDir, file.name, '+page.svelte')
					: path.join(routesDir, file.name);

				const astroFile = file.isDirectory()
					? path.join(pagesDir, `${file.name}.astro`)
					: path.join(pagesDir, 'index.astro');

				let importPath = path.relative(path.dirname(astroFile), sveltePage);
				importPath = importPath.split(path.sep).join('/');

				if (!importPath.startsWith('.')) importPath = './' + importPath;

				const content = `
---
import Page from '${importPath}';
import Layout from "../layout.astro"
---
<Layout><Page client:load /></Layout>
          `;

				fs.writeFileSync(astroFile, content.trim(), 'utf-8');
			}
		}
	};
}
