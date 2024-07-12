// import { unstable_dev } from 'wrangler';
import { env } from 'node:process';
import { lowstorage, lowstorageError, lowstorage_ERROR_CODES } from '../lib/lowstorage.js';

// import supertest from 'supertest';

const configCF = {
	endpoint: env.CF_ENDPOINT,
	region: env.CF_REGION,
	accessKeyId: env.CF_ACCESS_KEY_ID,
	secretAccessKey: env.CF_SECRET_ACCESS_KEY,
	bucketName: env.CF_BUCKET_NAME,
};

console.log('🏃 Running tests...', configCF);

const configMinio = {
	endPoint: env.MINIO_ENDPOINT,
	port: env.MINIO_PORT,
	region: env.MINIO_REGION,
	useSSL: env.MINIO_USE_SSL,
	accessKey: env.MINIO_ACCESS_KEY,
	secretKey: env.MINIO_SECRET_KEY,
	bucketName: env.MINIO_BUCKET_NAME,
};
const usersToInsert = [
	{ name: 'Alice', age: 30 },
	{ name: 'Bob', age: 25 },
	{ name: 'Charlie', age: 25 },
];

const userAvroSchema = {
	type: 'record',
	name: 'User',
	fields: [
		{ name: '_id', type: 'string', size: 16, logicalType: 'UUID' },
		{ name: 'name', type: 'string' },
		{ name: 'age', type: 'int' },
	],
};

const testColSchame = {
	type: 'record',
	name: 'TestCol',
	fields: [
		{ name: '_id', type: 'string', size: 16, logicalType: 'UUID' },
		{ name: 'name', type: 'string' },
		{ name: 'age', type: 'int' },
	],
};

// let worker = null;
let request;
let lStorage;

beforeAll(async () => {
	console.time('lowstorage-test');
	lStorage = new lowstorage(configCF);
});

afterAll(async () => {
	console.timeEnd('lowstorage-test');
});

// full test basic operations on collection
test('Collections | essentials check, create, list and delete collections', async () => {
	// check if collections exist
	const userColExists = await lStorage.collectionExists('userCol');
	// expect to be bollean
	expect(typeof userColExists).toBe('boolean');
	if (userColExists) {
		// try to create collection and get error
		await expect(lStorage.createCollection('userCol', userAvroSchema)).rejects.toThrowError();
		// remove collection
		const removeCollection = await lStorage.removeCollection('userCol');
		expect(removeCollection).toBe(true);
		const doubleCheckIfExists = await lStorage.collectionExists('userCol');
		expect(doubleCheckIfExists).toBe(false);
	}
	// create collection now
	const userCol = await lStorage.createCollection('userCol', userAvroSchema);
	expect(userCol).toBeDefined();
	const userColExists3 = await lStorage.collectionExists('userCol');
	expect(userColExists3).toBe(true);

	const listCollections = await lStorage.listCollections();
	expect(listCollections).toContain('userCol');
	await expect(lStorage.createCollection('userCol', userAvroSchema)).rejects.toThrowError();

	// check if collections exist
	const testColExists = await lStorage.collectionExists('testCol');
	// expect to be bollean
	expect(typeof testColExists).toBe('boolean');
	if (testColExists) {
		// try to create collection and get error
		await expect(lStorage.createCollection('testCol', testColSchame)).rejects.toThrowError();
		// remove collection
		const removeCollection = await lStorage.removeCollection('testCol');
		expect(removeCollection).toBe(true);
		const doubleCheckIfExists = await lStorage.collectionExists('testCol');
		expect(doubleCheckIfExists).toBe(false);
	}

	await lStorage.createCollection('testCol', testColSchame);

	const testColExists2 = await lStorage.collectionExists('testCol');
	expect(testColExists2).toBe(true);

	const listCollections2 = await lStorage.listCollections();
	console.log('listCollections', listCollections2);
	expect(listCollections2).toContain('testCol');
	expect(listCollections2).toContain('userCol');
	expect(listCollections2.length).toBe(2);

	const removeCollection = await lStorage.removeCollection('testCol');
	expect(removeCollection).toBe(true);

	const listCollections3 = await lStorage.listCollections();
	expect(listCollections3).not.toContain('testCol');
	expect(listCollections3).toContain('userCol');
	expect(listCollections3.length).toBe(1);

	const removeCollection2 = await lStorage.removeCollection('userCol');
	expect(removeCollection2).toBe(true);

	const listCollections4 = await lStorage.listCollections();
	expect(listCollections4).not.toContain('testCol');
	expect(listCollections4).not.toContain('userCol');
	expect(listCollections4.length).toBe(0);
});
// test create collection
test('Collections | create via createCollection', async () => {
	const preListCheck = await lStorage.listCollections();
	expect(preListCheck.length).toBe(0);

	const userCol = await lStorage.createCollection('userCol', userAvroSchema);
	expect(userCol).toBeDefined();

	const userColExists3 = await lStorage.collectionExists('userCol');
	expect(userColExists3).toBe(true);

	const listCollections = await lStorage.listCollections();
	expect(listCollections).toContain('userCol');
	expect(listCollections.length).toBe(1);

	const removeCollection = await lStorage.removeCollection('userCol');
	expect(removeCollection).toBe(true);

	const listCollections2 = await lStorage.listCollections();
	expect(listCollections2).not.toContain('userCol');
	expect(listCollections2.length).toBe(0);
});
test('Collections | create via constructor', async () => {
	const preListCheck = await lStorage.listCollections();
	expect(preListCheck.length).toBe(0);

	const userCol = await lStorage.collection('userCol', userAvroSchema);
	expect(userCol).toBeDefined();

	const userColExists = await lStorage.collectionExists('userCol');
	expect(userColExists).toBe(true);

	const listCollections = await lStorage.listCollections();
	expect(listCollections).toContain('userCol');
	expect(listCollections.length).toBe(1);
	const removeCollection = await lStorage.removeCollection('userCol');
	expect(removeCollection).toBe(true);

	const listCollections2 = await lStorage.listCollections();
	expect(listCollections2).not.toContain('userCol');
	expect(listCollections2.length).toBe(0);
});
test('Collections | error cases and error codes', async () => {
	// Test create collection error
	await expect(lStorage.createCollection()).rejects.toThrow(lowstorageError);
	await expect(lStorage.createCollection()).rejects.toThrow(lowstorage_ERROR_CODES.CREATE_COLLECTION_ERROR);

	// Test collection already exists error
	await lStorage.createCollection('testCol', testColSchame);
	await expect(lStorage.createCollection('testCol', testColSchame)).rejects.toThrow(lowstorageError);
	await expect(lStorage.createCollection('testCol', testColSchame)).rejects.toThrow(lowstorage_ERROR_CODES.COLLECTION_EXISTS);

	// TODO: test update collection schema error
	// Test rename collection error
	await expect(lStorage.renameCollection('testCol', 'testCol2')).rejects.toThrow(lowstorageError);
	await expect(lStorage.renameCollection('testCol', 'testCol2')).rejects.toThrow(lowstorage_ERROR_CODES.COLLECTION_NOT_FOUND);

	// await expect(lStorage.renameCollection('testCol2', 'testCol')).rejects.toThrow(lowstorageError);
	// await expect(lStorage.renameCollection('testCol2', 'testCol')).rejects.toThrow(lowstorage_ERROR_CODES.COLLECTION_NOT_FOUND);

	// // Test remove collection error
	// await expect(lStorage.removeCollection('testCol2')).rejects.toThrow(lowstorageError);
	// await expect(lStorage.removeCollection('testCol2')).rejects.toThrow(lowstorage_ERROR_CODES.COLLECTION_NOT_FOUND);
});
