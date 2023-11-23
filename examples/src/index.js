'use strict';

import lowstorage from '../../src/lowstorage.js';
import { Hono } from 'hono';
const app = new Hono();

app.post('/inserdata', async (c) => {
	// poor's man benchmark
	const requestStartTime = Date.now();
	const userCol = new lowstorage(c.env, 'MY_TESTING_BUCKET').collection('users');
	const jsonGeneratedData = await c.req.json();
	const insertedData = await userCol.insert(jsonGeneratedData);
	const executionTime = Date.now() - requestStartTime;
	console.log(`Request took ${executionTime}ms`);
	return c.json(insertedData);
});

// list all users
app.get('/users', async (c) => {
	const requestStartTime = Date.now();
	const userCol = new lowstorage(c.env, 'MY_TESTING_BUCKET').collection('users');
	const users = await userCol.find({});
	const executionTime = Date.now() - requestStartTime;
	console.log(`Request took ${executionTime}ms`);
	return c.json({ users });
});

app.get('/users-count', async (c) => {
	const userCol = new lowstorage(c.env, 'MY_TESTING_BUCKET').collection('users');
	const usersCount = await userCol.count();
	return c.text(usersCount);
});

// get user
app.get('/user/:id', async (c) => {
	const id = c.req.param('id');
	const userCol = new lowstorage(c.env, 'MY_TESTING_BUCKET').collection('users');
	const user = await userCol.find({ _id: id });
	return c.json({ user });
});

// list all users
app.get('/users-delete-all', async (c) => {
	const userCol = new lowstorage(c.env, 'MY_TESTING_BUCKET').collection('users');
	const users = await userCol.remove({});
	return c.json({ users });
});

export default app;
