'use strict';

import lowstorage from '../../lib/lowstorage.js';
import { Hono } from 'hono';
const app = new Hono();

const BUCKET_NAME = 'MY_TESTING_BUCKET';
const USER_COL = 'users';

app.post('/inserdata', async (c) => {
	// poor's man benchmark
	const requestStartTime = Date.now();
	const userCol = new lowstorage(c.env, BUCKET_NAME).collection(USER_COL);
	const jsonGeneratedData = await c.req.json();
	const insertedData = await userCol.insert(jsonGeneratedData);
	const executionTime = Date.now() - requestStartTime;
	console.log(`Request took ${executionTime}ms`);
	return c.json(insertedData);
});

app.post('/update/:id', async (c) => {
	const id = c.req.param('id');
	const jsonGeneratedData = await c.req.json();
	const userCol = new lowstorage(c.env, BUCKET_NAME).collection(USER_COL);
	const updatedDataRespo = await userCol.update({ _id: id }, jsonGeneratedData);
	return c.json(updatedDataRespo);
});

// list all "collections"
app.get('/list-collections', async (c) => {
	const ls = new lowstorage(c.env, BUCKET_NAME);
	const allCols = await ls.listCollections();
	return c.json({ allCols });
});

// list all users
app.get('/users', async (c) => {
	const requestStartTime = Date.now();
	const userCol = new lowstorage(c.env, BUCKET_NAME).collection(USER_COL);
	const users = await userCol.find({});
	const executionTime = Date.now() - requestStartTime;
	console.log(`Request took ${executionTime}ms`);
	return c.json({ users });
});

app.get('/users-count', async (c) => {
	const userCol = new lowstorage(c.env, BUCKET_NAME).collection('users');
	const usersCount = await userCol.count();
	return c.text(usersCount);
});

// get user
app.get('/user/:id', async (c) => {
	const id = c.req.param('id');
	const userCol = new lowstorage(c.env, BUCKET_NAME).collection(USER_COL);
	const user = await userCol.find({ _id: id });
	return c.json({ user });
});

// find all with value
app.get('/search/:value', async (c) => {
	const value = c.req.param('value');
	const userCol = new lowstorage(c.env, BUCKET_NAME).collection(USER_COL);
	const users = await userCol.find({ name: value });
	return c.json({ users });
});

// list all users
app.get('/users-delete-all', async (c) => {
	const userCol = new lowstorage(c.env, BUCKET_NAME).collection(USER_COL);
	const users = await userCol.remove({});
	return c.json({ users });
});

export default app;
