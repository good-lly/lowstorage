import { env } from 'node:process';
import { lowstorage, lowstorageError, lowstorage_ERROR_CODES } from '../build/lowstorage.min.js';

const config = {
	endpoint: env.ENDPOINT || process.env.ENDPOINT || 'http://127.0.0.1:9000',
	region: env.REGION || process.env.REGION || 'auto',
	accessKeyId: env.ACCESS_KEY_ID || process.env.ACCESS_KEY_ID || 'minio_user',
	secretAccessKey: env.SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY || 'minio_password',
	bucketName: env.BUCKET_NAME || process.env.BUCKET_NAME || 'lowstorage-test',
};

console.log('🏃 Running tests...', config);

const userAvroSchema = {
	type: 'record',
	name: 'User',
	fields: [
		{ name: '_id', type: 'string', size: 16, logicalType: 'UUID' },
		{ name: 'name', type: 'string' },
		{ name: 'age', type: 'int' },
	],
};

const testColSchema = {
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
	lStorage = new lowstorage(config);
	const exists = await lStorage.createStorage();
	if (!exists) {
		console.log('🚨 Failed to create storage, exiting...');
		console.log(`Check if the bucket ${config.bucketName} exists and if your s3 credentials allow bucket creation. Or make it manually.`);
		process.exit(1);
	}
	// clean up any existing collections
	const listCollections = await lStorage.listCollections();
	console.log('🧹 Cleaning up collections...', listCollections);
	for (const col of listCollections) {
		await lStorage.removeCollection(col);
	}
});

afterAll(async () => {
	console.timeEnd('lowstorage-test');
});

// full test basic operations on collection
test('Collections | basic CRUD operations', async () => {
	console.time('Collections | basic CRUD operations');
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
		await expect(lStorage.createCollection('testCol', testColSchema)).rejects.toThrowError();
		// remove collection
		const removeCollection = await lStorage.removeCollection('testCol');
		expect(removeCollection).toBe(true);
		const doubleCheckIfExists = await lStorage.collectionExists('testCol');
		expect(doubleCheckIfExists).toBe(false);
	}

	await lStorage.createCollection('testCol', testColSchema);

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
	console.timeEnd('Collections | basic CRUD operations');
});
// test create collection
test('Collections | create via createCollection', async () => {
	console.time('Collections | create via createCollection');
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

	const listCollections22 = await lStorage.listCollections();
	expect(listCollections22).not.toContain('userCol');
	expect(listCollections22.length).toBe(0);
	console.timeEnd('Collections | create via createCollection');
});
test('Collections | create via constructor', async () => {
	console.time('Collections | create via constructor');
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

	const listCollections3 = await lStorage.listCollections();
	expect(listCollections3).not.toContain('userCol');
	expect(listCollections3.length).toBe(0);
	console.timeEnd('Collections | create via constructor');
});
test('Collections | error cases and error codes', async () => {
	console.time('Collections | error cases and error codes');
	// Test create collection error
	try {
		await lStorage.createCollection();
	} catch (error) {
		expect(error).toBeInstanceOf(lowstorageError);
		expect(error.code).toBe(lowstorage_ERROR_CODES.CREATE_COLLECTION_ERROR);
	}

	const testCol = await lStorage.createCollection('testCol', testColSchema);
	// Test collection already exists error
	try {
		await lStorage.createCollection('testCol', testColSchema);
	} catch (error) {
		expect(error).toBeInstanceOf(lowstorageError);
		expect(error.code).toBe(lowstorage_ERROR_CODES.CREATE_COLLECTION_ERROR);
	}

	const listCollections = await lStorage.listCollections();
	expect(listCollections).toContain('testCol');

	// Verify the collection exists before attempting to rename
	const testColExists = await lStorage.collectionExists('testCol');
	expect(testColExists).toBe(true);

	// Test rename collection
	const tesCol2 = await testCol.renameCollection('testCol2');
	await expect(tesCol2).toBeDefined();
	await expect(tesCol2).toBeInstanceOf(Object);

	const testCol2Exists = await lStorage.collectionExists('testCol2');
	expect(testCol2Exists).toBe(true);

	const listCollectionsAfterRename = await lStorage.listCollections();
	console.log('listCollectionsAfterRename::::: ', listCollectionsAfterRename);
	expect(listCollectionsAfterRename).not.toContain('testCol');
	expect(listCollectionsAfterRename).toContain('testCol2');

	// Verify the collection exists after renaming
	const col2Exists = await lStorage.collectionExists('testCol2');
	expect(col2Exists).toBe(true);

	// Test rename collection error
	// await expect(testCol.renameCollection('testCol2')).rejects.toThrow(lowstorageError);
	try {
		await testCol.renameCollection('testCol2');
	} catch (error) {
		expect(error).toBeInstanceOf(lowstorageError);
		expect(error.code).toBe(lowstorage_ERROR_CODES.COLLECTION_EXISTS);
	}

	// // Test remove collection error
	try {
		await lStorage.removeCollection('testCol');
	} catch (error) {
		expect(error).toBeInstanceOf(lowstorageError);
		expect(error.code).toBe(lowstorage_ERROR_CODES.REMOVE_COLLECTION_ERROR);
	}

	// Test update collection schema error - NOT IMPLEMENTED
	// const testColSchema = {
	// 	type: 'record',
	// 	name: 'TestCol',
	// 	fields: [
	// 		{ name: '_id', type: 'string', size: 16, logicalType: 'UUID' },
	// 		{ name: 'name', type: 'string' },
	// 		{ name: 'age', type: 'int' },
	// 	],
	// };
	// await expect(lStorage.updateCollectionSchema('testCol', testColSchema)).rejects.toThrow(lowstorageError);
	// await expect(lStorage.updateCollectionSchema('testCol', testColSchema)).rejects.toThrow(lowstorage_ERROR_CODES.COLLECTION_NOT_FOUND);

	// Test schema validation error
	const invalidSchema = { type: 'invalid' };
	await expect(lStorage.createCollection('invalidSchemaCol', invalidSchema)).rejects.toThrow(
		lowstorage_ERROR_CODES.SCHEMA_VALIDATION_ERROR,
	);
	const listCollections3 = await lStorage.listCollections();
	expect(listCollections3).not.toContain('invalidSchemaCol');

	// Test document validation error
	await expect(tesCol2.insert({ invalidField: 'value' })).rejects.toThrow(lowstorage_ERROR_CODES.DOCUMENT_VALIDATION_ERROR);

	// Test insert error
	await expect(tesCol2.insert(null)).rejects.toThrow(lowstorage_ERROR_CODES.INSERT_ERROR);

	// Test update error
	await expect(tesCol2.update(null, { field: 'value' })).rejects.toThrow(lowstorage_ERROR_CODES.MISSING_ARGUMENT);

	// Test update one error
	await expect(tesCol2.updateOne(null, { field: 'value' })).rejects.toThrow(lowstorage_ERROR_CODES.MISSING_ARGUMENT);

	// Test delete error
	await expect(tesCol2.delete(null)).rejects.toThrow(lowstorage_ERROR_CODES.MISSING_ARGUMENT);

	// Test count error - wrong argument
	await expect(tesCol2.count(null)).rejects.toThrow(lowstorage_ERROR_CODES.COUNT_ERROR);
	const count = await tesCol2.count();
	await expect(count).toBe(0);

	// Test remove collection error
	await expect(lStorage.removeCollection(null)).rejects.toThrow(lowstorage_ERROR_CODES.REMOVE_COLLECTION_ERROR);

	// Test rename collection error
	await expect(tesCol2.renameCollection(null)).rejects.toThrow(lowstorage_ERROR_CODES.RENAME_COLLECTION_ERROR);

	// Clean up
	await lStorage.removeCollection('testCol2');
	console.timeEnd('Collections | error cases and error codes');
});

test('Document | CRUD operations', async () => {
	console.time('Document | CRUD operations');
	// Test insert
	const colName = 'testColXXXX';
	const col = await lStorage.collection(colName);
	const insertData = await col.insert({ name: 'Carlos', age: 25 });
	expect(insertData).toBeDefined();
	expect(insertData).toHaveLength(1);
	expect(insertData[0]).toHaveProperty('_id');
	expect(insertData[0]).toHaveProperty('name', 'Carlos');
	expect(insertData[0]).toHaveProperty('age', 25);

	// Test by find
	const findData = await col.find({ name: 'Carlos' });
	expect(findData).toBeDefined();
	expect(findData).toHaveLength(1);
	expect(findData[0]).toHaveProperty('_id');
	expect(findData[0]).toHaveProperty('name', 'Carlos');
	expect(findData[0]).toHaveProperty('age', 25);

	// Test get collection etag
	const etag = col.getCollectionETag();
	expect(etag).toBeDefined();
	expect(etag).not.toBe('');

	// Test insert with schema
	const insertDataWithSchema = await col.insert({ name: 'Carlos', age: 25 }, userAvroSchema);
	expect(insertDataWithSchema).toBeDefined();
	expect(insertDataWithSchema).toHaveLength(1);
	expect(insertDataWithSchema[0]).toHaveProperty('_id');
	expect(insertDataWithSchema[0]).toHaveProperty('name', 'Carlos');
	expect(insertDataWithSchema[0]).toHaveProperty('age', 25);

	// Test get collection etag
	const etag2 = col.getCollectionETag();
	expect(etag2).toBeDefined();
	expect(etag2).not.toBe('');
	expect(etag2).not.toBe(etag);

	// Test by find
	const findDataWithSchema = await col.find({ name: 'Carlos' });
	expect(findDataWithSchema).toBeDefined();
	expect(findDataWithSchema).toHaveLength(2);
	expect(findDataWithSchema[0]).toHaveProperty('_id');
	expect(findDataWithSchema[0]).toHaveProperty('name', 'Carlos');
	expect(findDataWithSchema[0]).toHaveProperty('age', 25);

	// test count
	const count = await col.count({ name: 'Carlos' });
	expect(count).toBe(2);

	const count2 = await col.count();
	expect(count2).toBe(2);

	const count3 = await col.count({ name: 'Carlos2' });
	expect(count3).toBe(0);

	// Test insert with invalid schema
	const invalidSchema = { type: 'invalid' };
	await expect(col.insert({ name: 'Carlos', age: 25 }, invalidSchema)).rejects.toThrow(lowstorage_ERROR_CODES.SCHEMA_VALIDATION_ERROR);

	// Test insert with invalid data
	await expect(col.insert(null)).rejects.toThrow(lowstorage_ERROR_CODES.INSERT_ERROR);

	// Test insert with array
	const insertDataArray = await col.insert([
		{ name: 'Carlos', age: 25 },
		{ name: 'Bob', age: 30 },
	]);
	expect(insertDataArray).toBeDefined();
	expect(insertDataArray).toHaveLength(2);
	expect(insertDataArray[0]).toHaveProperty('_id');
	expect(insertDataArray[0]).toHaveProperty('name', 'Carlos');
	expect(insertDataArray[0]).toHaveProperty('age', 25);
	expect(insertDataArray[1]).toHaveProperty('_id');
	expect(insertDataArray[1]).toHaveProperty('name', 'Bob');
	expect(insertDataArray[1]).toHaveProperty('age', 30);

	// Test insert with array and schema
	const insertDataArrayWithSchema = await col.insert(
		[
			{ name: 'Carlos', age: 25 },
			{ name: 'Bob', age: 30 },
		],
		userAvroSchema,
	);

	expect(insertDataArrayWithSchema).toBeDefined();
	expect(insertDataArrayWithSchema).toHaveLength(2);
	expect(insertDataArrayWithSchema[0]).toHaveProperty('_id');
	expect(insertDataArrayWithSchema[0]).toHaveProperty('name', 'Carlos');
	expect(insertDataArrayWithSchema[0]).toHaveProperty('age', 25);
	expect(insertDataArrayWithSchema[1]).toHaveProperty('_id');
	expect(insertDataArrayWithSchema[1]).toHaveProperty('name', 'Bob');
	expect(insertDataArrayWithSchema[1]).toHaveProperty('age', 30);

	// Test insert with invalid array
	await expect(col.insert(null)).rejects.toThrow(lowstorage_ERROR_CODES.INSERT_ERROR);

	// Test insert with invalid array and schema
	await expect(
		col.insert(
			[
				{ name: 'Carlos', age: 25 },
				{ name: 'Bob', age: 30 },
			],
			invalidSchema,
		),
	).rejects.toThrow(lowstorage_ERROR_CODES.SCHEMA_VALIDATION_ERROR);

	// Test update
	const updateData = await col.update({ name: 'Carlos' }, { name: 'Carlos2' });
	expect(updateData).toBeDefined();
	expect(updateData).toBe(4);
	expect(updateData).toEqual(4);

	// Get collection etag
	const etag3 = col.getCollectionETag();
	expect(etag3).toBeDefined();
	expect(etag3).not.toBe('');
	expect(etag3).not.toBe(etag2);

	// Test upsert
	const updateData2 = await col.update({ name: 'Kim' }, { name: 'Kimono', age: 30 }, { upsert: true });
	expect(updateData2).toBeDefined();
	expect(updateData2).toBe(1);
	expect(updateData2).toEqual(1);

	const findKimono = await col.find({ name: 'Kimono' });
	expect(findKimono).toBeDefined();
	expect(findKimono).toHaveLength(1);
	expect(findKimono[0]).toHaveProperty('_id');
	expect(findKimono[0]).toHaveProperty('name', 'Kimono');
	expect(findKimono[0]).toHaveProperty('age', 30);

	// Test update with invalid array
	await expect(col.update(null, { name: 'Carlos2' })).rejects.toThrow(lowstorage_ERROR_CODES.UPDATE_ERROR);

	// Test delete
	const deleteData = await col.delete({ name: 'Carlos2' });
	expect(deleteData).toBeDefined();
	expect(deleteData).toBe(4);

	// Test delete with invalid data
	await expect(col.delete(null)).rejects.toThrow(lowstorage_ERROR_CODES.DELETE_ERROR);

	// Test delete with array
	const deleteDataArray = await col.delete({ name: 'Bob' });
	expect(deleteDataArray).toBeDefined();
	expect(deleteDataArray).toBe(2);

	// Test delete with invalid array
	await expect(col.delete(null)).rejects.toThrow(lowstorage_ERROR_CODES.DELETE_ERROR);

	// cleanup
	await lStorage.removeCollection(colName);
	console.timeEnd('Document | CRUD operations');
});

test('Document | cachcing and race conditions', async () => {
	console.time('Document | cachcing and race conditions');
	const colName = 'testColX1';
	const exsists = await lStorage.collectionExists(colName);
	if (exsists) {
		await lStorage.removeCollection(colName);
	}
	const lStorage2 = new lowstorage(config);
	const col2 = await lStorage2.collection(colName);

	const col = await lStorage.collection(colName);
	const insertData = await col.insert({ name: 'Carlos', age: 25 }, userAvroSchema);

	expect(insertData).toBeDefined();
	expect(insertData).toHaveLength(1);
	expect(insertData[0]).toHaveProperty('_id');
	expect(insertData[0]).toHaveProperty('name', 'Carlos');
	expect(insertData[0]).toHaveProperty('age', 25);

	const insertData2 = await col.insert({ name: 'Bob', age: 12 });

	expect(col2.find({ name: 'Carlos' })).rejects.toThrow(lowstorage_ERROR_CODES.FIND_ERROR);

	col2.setAvroSchema(userAvroSchema);
	const schema2 = col2.getAvroSchema();
	expect(schema2).toBeDefined();

	const schema1 = col.getAvroSchema();
	expect(schema1).toBeDefined();

	const find1 = await col.find({ name: 'Carlos' });

	expect(find1).toBeDefined();
	expect(find1).toHaveLength(1);
	expect(find1[0]).toHaveProperty('_id');
	expect(find1[0]).toHaveProperty('name', 'Carlos');
	expect(find1[0]).toHaveProperty('age', 25);

	const findData2 = await col2.find({ name: 'Carlos' });

	expect(findData2).toBeDefined();
	expect(findData2).toHaveLength(1);
	expect(findData2[0]).toHaveProperty('_id');
	expect(findData2[0]).toHaveProperty('name', 'Carlos');
	expect(findData2[0]).toHaveProperty('age', 25);

	const findBob = await col2.find({ name: 'Bob' });

	expect(findBob).toBeDefined();
	expect(findBob).toHaveLength(1);
	expect(findBob[0]).toHaveProperty('_id');
	expect(findBob[0]).toHaveProperty('name', 'Bob');
	expect(findBob[0]).toHaveProperty('age', 12);

	const updateData = await col2.update({ name: 'Carlos' }, { name: 'Carlos2' });

	expect(updateData).toBeDefined();
	expect(updateData).toBe(1);
	expect(updateData).toEqual(1);

	const updateData2 = await col2.update({ name: 'Bob' }, { age: 30 });
	expect(updateData2).toBeDefined();
	expect(updateData2).toBe(1);
	expect(updateData2).toEqual(1);

	const checkBob = await col.find({ name: 'Bob' });
	expect(checkBob).toBeDefined();
	expect(checkBob).toHaveLength(1);
	expect(checkBob[0]).toHaveProperty('_id');
	expect(checkBob[0]).toHaveProperty('name', 'Bob');
	expect(checkBob[0]).toHaveProperty('age', 30);

	// Test update with invalid schema
	await expect(col.update({ name: 'Carlos2' }, { surname: 'CarlosesSurname' })).rejects.toThrow(lowstorage_ERROR_CODES.UPDATE_ERROR);
	const updateCheck = await col2.find({ name: 'Carlos2' });
	expect(updateCheck).toBeDefined();
	expect(updateCheck).toHaveLength(1);
	expect(updateCheck[0]).toHaveProperty('_id');
	expect(updateCheck[0]).toHaveProperty('name', 'Carlos2');
	expect(updateCheck[0]).toHaveProperty('age', 25);
	expect(updateCheck[0]).not.toHaveProperty('surname', 'CarlosesSurname');
	console.timeEnd('Document | cachcing and race conditions');
});
