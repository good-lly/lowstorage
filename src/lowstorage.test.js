const { unstable_dev } = require('wrangler');
const supertest = require('supertest');

console.log('🏃 Running tests...');

let worker = null;
let request;
const usersToInsert = [
	{ name: 'Alice', age: 30 },
	{ name: 'Bob', age: 25 },
];

beforeAll(async () => {
	worker = await unstable_dev('./examples/src/index.js', {
		config: './examples/wrangler.toml',
		experimental: { disableExperimentalWarning: true },
	});
	const protocol = worker.proxyData.userWorkerUrl.protocol;
	const hostname = worker.proxyData.userWorkerUrl.hostname;
	const port = worker.proxyData.userWorkerUrl.port;
	const fullUrl = `${protocol}//${hostname}:${port}`;
	request = supertest(fullUrl);
	console.log('✅ Worker started at ', fullUrl);
});

afterAll(async () => {
	if (worker) await worker.stop();
});

test('POST /insertdata - inserts multiple users', async () => {
	for (const user of usersToInsert) {
		const response = await request.post('/insertdata').send(user);
		expect(response.status).toBe(200);
		expect(response.body._id).toBeDefined();
	}
});

test('GET /users-count - gets the correct user count', async () => {
	const response = await request.get('/users-count');
	expect(response.status).toBe(200);
	// Assuming the response returns a plain text count
	const userCount = parseInt(response.text, 10);
	// Replace with the expected count after insertions
	expect(userCount).toBe(2);
});

test('GET /users - fetches all users', async () => {
	const response = await request.get('/users');
	expect(response.status).toBe(200);
	expect(Array.isArray(response.body.users)).toBe(true);
	expect(response.body.users.length).toBe(2); // Expect the inserted count
});

test('POST /update/:id - updates an existing user', async () => {
	// 1. Insert a test user
	const testUser = { name: 'John Doe', age: 35 };
	const insertResponse = await request.post('/insertdata').send(testUser);
	expect(insertResponse.status).toBe(200);

	const userId = insertResponse.body._id;

	// 2. Update user data
	const updatedData = { name: 'Jane Smith', age: 30 };
	const updateResponse = await request.post(`/update/${userId}`).send(updatedData);
	expect(updateResponse.status).toBe(200);

	// 3. Verify the update
	const getResponse = await request.get(`/user/${userId}`);
	expect(getResponse.status).toBe(200);
	expect(getResponse.body.user.name).toBe('Jane Smith');
	expect(getResponse.body.user.age).toBe(30);
});

test('GET /search/:value - finds users by name', async () => {
	const searchName = 'Alice';
	const response = await request.get(`/search/${searchName}`);
	expect(response.status).toBe(200);
	expect(response.body.users.length).toBeGreaterThanOrEqual(1);
	expect(response.body.users[0].name).toBe(searchName);
});

test('GET /users-delete-all - deletes all users', async () => {
	const deleteResponse = await request.get('/users-delete-all');
	expect(deleteResponse.status).toBe(200);

	// Verify count is zero
	const countResponse = await request.get('/users-count');
	expect(countResponse.status).toBe(200);
	expect(parseInt(countResponse.text, 10)).toBe(0);
});

test('POST /insertdata - handles very long user names ', async () => {
	const veryLongName = 'X'.repeat(256); // Assume some maximum name length
	const user = { name: veryLongName, age: 30 };
	const response = await request.post('/insertdata').send(user);
	// Option 2: Expect truncation (if your app silently truncates)
	expect(response.status).toBe(200);
	expect(response.body.name.length).toBeLessThanOrEqual(256); // Max length
});

test('GET /search/:value - handles non-existent search values', async () => {
	const searchName = 'NonExistentUser';
	const response = await request.get(`/search/${searchName}`);
	expect(response.status).toBe(200);
	expect(response.body.users).toEqual([]); // Empty array
});

test('GET /users-delete-all - handles deletion on an empty collection', async () => {
	// Ensure the collection is empty before the test
	await request.get('/users-delete-all');
	const deleteResponse = await request.get('/users-delete-all');

	// Choose the appropriate expectation
	// Option 1: Success
	expect(deleteResponse.status).toBe(200);

	// Option 2: Error (if your app design dictates)
	expect(deleteResponse.status).toBe(404); // Or another suitable error code
});
