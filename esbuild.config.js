import { build as _build } from 'esbuild';

_build({
	entryPoints: ['lib/lowstorage.js'],
	bundle: true,
	minify: false,
	sourcemap: true,
	platform: 'node',
	target: 'NodeNext',
	module: 'nodenext',
	format: 'esm',
	treeShaking: true,
	outfile: 'build/lowstorage.js',
})
	.then((value) => console.log('Build complete', value))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
