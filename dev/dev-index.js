import { lowstorage } from '../lib/lowstorage.js';
import { env } from 'node:process';
// import { MongoClient, ServerApiVersion } from 'mongodb';

const configCF = {
	endpoint: env.CF_ENDPOINT,
	region: env.CF_REGION,
	accessKeyId: env.CF_ACCESS_KEY_ID,
	secretAccessKey: env.CF_SECRET_ACCESS_KEY,
	bucketName: env.CF_BUCKET_NAME,
};

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

// async function mongoRun() {
// 	try {
// 		console.time('mongodb');
// 		const uri = '';
// 		// Create a MongoClient with a MongoClientOptions object to set the Stable API version
// 		const client = new MongoClient(uri, {
// 			serverApi: {
// 				version: ServerApiVersion.v1,
// 				strict: true,
// 				deprecationErrors: true,
// 			},
// 		});
// 		const userMongoSchema = {
// 			$jsonSchema: {
// 				bsonType: 'object',
// 				required: ['_id', 'name', 'age'],
// 				properties: {
// 					_id: {
// 						bsonType: 'string',
// 						pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
// 					},
// 					name: {
// 						bsonType: 'string',
// 					},
// 					age: {
// 						bsonType: 'int',
// 					},
// 				},
// 			},
// 		};
// 		// Connect the client to the server	(optional starting in v4.7)
// 		await client.connect();
// 		const dbname = 'testing';
// 		const colName = 'users';
// 		// Create a database
// 		await client.db(dbname).createCollection(colName, {
// 			validator: userMongoSchema,
// 		});
// 		//console.log('Database created');
// 		const collection = client.db(dbname).collection(colName);
// 		// Insert a document
// 		await collection.insertMany(usersToInsert);
// 		//console.log('Document inserted');
// 		// Find documents
// 		const findResult = await collection.find({}).toArray();
// 		console.log('Find result', findResult);

// 		// // find two users
// 		// const twoUsers = await collection.find({}, { skip: 0, limit: 2 }).toArray();
// 		// //console.log('twoUsers', twoUsers);

// 		// // find user by ID and update name
// 		// const id = twoUsers[1]._id;
// 		// const secondUser = await collection.findOne({ _id: id });
// 		// //console.log('secondUser', secondUser, secondUser._id);

// 		// // update user
// 		// const updateUser = await collection.updateOne({ _id: id }, { $set: { name: 'Carlos' } });
// 		// //console.log('updateUser', updateUser);

// 		// // check if user name updated
// 		// const updatedUser = await collection.findOne({ _id: id });
// 		// //console.log('updatedUser', updatedUser);

// 		// // find all users with name 'Carlos'
// 		// const findUser = await collection.find({ name: 'Carlos' }).toArray();
// 		// //console.log('findUser', findUser);

// 		// // delete user
// 		// const deleteUser = await collection.deleteOne({ _id: id });
// 		// //console.log('deleteUser', deleteUser);

// 		// // find all users
// 		// const allUsersAfterDelete = await collection.find({}).toArray();
// 		// //console.log('allUsersAfterDelete', allUsersAfterDelete);

// 		// // update all with name Charlie
// 		// const updateAll = await collection.updateMany({ name: 'Charlie' }, { $set: { name: 'Carlos' } });
// 		// //console.log('updateAll charlie to carlos', updateAll);

// 		// // find all users with name Carlos
// 		// const findAll = await collection.find({ name: 'Carlos' }).toArray();
// 		// //console.log('findAll carlos', findAll);

// 		// // delete collection
// 		// const deleteCollection = await collection.drop();
// 		await client.close();
// 		//console.log('deleteCollection', deleteCollection);
// 	} finally {
// 		// Ensures that the client will close when you finish/error
// 		console.timeEnd('mongodb');
// 	}
// }
// mongoRun().catch(console.dir);

async function lowstorageRun() {
	try {
		console.time('lowstorage');
		const ls_cf = new lowstorage(configCF);

		const userCol = await ls_cf.collection('users', userAvroSchema);

		// Add new users
		const newUsers = await userCol.insert(usersToInsert);
		//console.log('newUsers', newUsers);

		// list all collections
		const listCollections = await ls_cf.listCollections();
		console.log('listCollections', listCollections);

		// list all users
		const allUsers = await userCol.find({});
		console.log('allUsers', allUsers);

		// find users with pagination (e.g., page 2, 10 users per page)
		const twoUsers = await userCol.find({}, { skip: 0, limit: 2 });
		//console.log('twoUsers', twoUsers);

		// find user by ID and update name
		const id = twoUsers[1]._id;
		const secondUser = await userCol.findOne({ _id: id });
		//console.log('secondUser', secondUser, secondUser._id);

		// update user
		const updateUser = await userCol.updateOne({ _id: id }, { name: 'Carlos' });
		//console.log('updateUser', updateUser);

		// check if user name updated
		const updatedUser = await userCol.findOne({ _id: id });
		//console.log('updatedUser', updatedUser);

		// find all users with name 'Carlos'
		const findUser = await userCol.find({ name: 'Carlos' });
		//console.log('findUser', findUser);

		// delete user
		const deleteUser = await userCol.delete({ _id: id });
		//console.log('deleteUser', deleteUser);

		// find all users
		const allUsersAfterDelete = await userCol.find({});
		//console.log('allUsersAfterDelete', allUsersAfterDelete);

		// update all with name Charlie
		const updateAll = await userCol.update({ name: 'Charlie' }, { name: 'Carlos' });
		//console.log('updateAll charlie to carlos', updateAll);

		// find all users with name Carlos
		const findAll = await userCol.find({ name: 'Carlos' });
		//console.log('findAll carlos', findAll);

		// delete collection
		const deleteCollection = await ls_cf.removeCollection('users');
		console.log('deleteCollection', deleteCollection);
	} finally {
		console.timeEnd('lowstorage');
	}
}
lowstorageRun().catch(console.dir);
