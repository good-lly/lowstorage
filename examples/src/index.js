/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import lowstorage from '../../lowstorage';

export default {
	async fetch(request, env, ctx) {
		const userCol = new lowstorage(env, 'MY_TESTING_BUCKET').collection('users');
		const john = await userCol.insert({
			name: 'Mark',
			age: 128,
		});
		console.log('john', john);
		const users = await userCol.find({ name: 'Mark' });
		for (const user of users) {
			console.log('user', user);
		}
		return new Response('Hello World!');
	},
};
