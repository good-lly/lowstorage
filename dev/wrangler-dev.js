import { Hono } from 'hono';

import { lowstorage } from '../lib/lowstorage.js';

const app = new Hono();
console.log('Worker is running!');

app.get('/', async (c) => {
	const configCFS3 = {
		endpoint: c.env.ENDPOINT,
		region: c.env.REGION,
		accessKeyId: c.env.ACCESS_KEY_ID,
		secretAccessKey: c.env.SECRET_ACCESS_KEY,
		bucketName: c.env.BUCKET_NAME,
	};
	const storage = new lowstorage(configCFS3);
	console.log('ls is ' + (await storage.listCollections()));
	return c.json(configCFS3, 200);
});

export default app;
