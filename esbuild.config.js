// import { build as _build } from 'esbuild';
// // import { polyfillNode } from 'esbuild-plugin-polyfill-node';

// _build({
// 	entryPoints: ['lib/lowstorage.js'],
// 	bundle: true,
// 	minify: true,
// 	sourcemap: true,
// 	platform: 'node',
// 	target: 'node16',
// 	format: 'esm',
// 	treeShaking: true,
// 	outfile: 'build/lowstorage.js',
// 	// plugins: [
// 	// 	polyfillNode({
// 	// 		buffer: true,
// 	// 		process: false,
// 	// 		crypto: false,
// 	// 	}),
// 	// ],
// })
// 	.then((value) => console.log('Build complete', value))
// 	.catch((err) => {
// 		console.error(err);
// 		process.exit(1);
// 	});
