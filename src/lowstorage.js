'use strict';

import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// const _checkArgs = (...args) => {
// 	for (const arg of args) {
// 		if (typeof arg !== 'object' || arg === null) {
// 			throw new Error('lowstorage: missing args or args not an object');
// 		}
// 	}
// };

// const isAWS = !!(process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV);
// const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
const _hasCrypto = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function';
const _generateUUID = !!_hasCrypto ? () => crypto.randomUUID() : () => import('node:crypto').then((module) => module.randomUUID());

const _matchesQuery = (document, query) => {
	return Object.keys(query).every((key) => document[key] === query[key]);
};

const streamToString = (stream) =>
	new Promise((resolve, reject) => {
		const chunks = [];
		stream.on('data', (chunk) => chunks.push(chunk));
		stream.on('error', reject);
		stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
	});

class S3Store {
	constructor({ endPoint, region, useSSL, accessKeyId, secretAccessKey, bucketName }) {
		this.client = new S3Client({
			endpoint: endPoint,
			region: region,
			credentials: {
				accessKeyId: accessKeyId,
				secretAccessKey: secretAccessKey,
			},
			forcePathStyle: true,
		});
		this.bucketName = bucketName;
	}

	async get(key) {
		try {
			const command = new GetObjectCommand({
				Bucket: this.bucketName,
				Key: key,
			});
			const response = await this.client.send(command);
			const bodyContents = await streamToString(response.Body);
			return JSON.parse(bodyContents);
		} catch (error) {
			if (error.name === 'NoSuchKey') {
				return null;
			}
			throw error;
		}
	}

	async put(key, data) {
		const command = new PutObjectCommand({
			Bucket: this.bucketName,
			Key: key,
			Body: data,
			ContentType: 'application/json',
		});
		await this.client.send(command);
	}

	async delete(key) {
		const command = new DeleteObjectCommand({
			Bucket: this.bucketName,
			Key: key,
		});
		await this.client.send(command);
	}

	async list(prefix = '') {
		const command = new ListObjectsV2Command({
			Bucket: this.bucketName,
			Prefix: prefix,
		});
		const response = await this.client.send(command);
		return response.Contents || [];
	}
}

class Collection {
	constructor(colName, store) {
		this._colName = colName;
		this._store = store;
	}

	async _loadData() {
		const data = await this._store.get(`${this._colName}/${this._colName}.json`);
		return data || [];
	}

	async _saveData(data) {
		const key = `${this._colName}/${this._colName}.json`;
		await this._store.put(key, JSON.stringify(data));
	}

	async insert(doc) {
		if (!Array.isArray(doc)) {
			doc = [doc];
		}
		const data = await this._loadData();
		for (let item of doc) {
			if (typeof item !== 'object' || item === null) {
				throw new Error('Invalid input: input must be an object or an array of objects');
			}
			item._id = item._id || _generateUUID();
			data.push(item);
		}
		await this._saveData(data);
		return doc.length === 1 ? doc[0] : doc;
	}

	async find(query = {}, options = {}) {
		const data = await this._loadData();
		const start = parseInt(options.skip, 10) || 0;
		const end = parseInt(options.limit, 10) ? start + parseInt(options.limit, 10) : undefined;
		const filteredData = data.filter((doc) => _matchesQuery(doc, query)).slice(start, end);
		return filteredData;
	}

	async findOne(query = {}) {
		return (await this.find(query))[0] || null;
	}

	async update(query = {}, update = {}) {
		const data = await this._loadData();
		let updatedCount = 0;

		for (let i = 0; i < data.length; i++) {
			if (_matchesQuery(data[i], query)) {
				Object.assign(data[i], update);
				updatedCount++;
			}
		}

		if (updatedCount > 0) {
			await this._saveData(data);
		}

		return updatedCount;
	}

	async updateOne(query = {}, update = {}) {
		const data = await this._loadData();
		const docIndex = data.findIndex((doc) => _matchesQuery(doc, query));

		if (docIndex !== -1) {
			Object.assign(data[docIndex], update);
			await this._saveData(data);
			return 1;
		}
		return 0;
	}

	async delete(query = {}) {
		const data = await this._loadData();
		const initialLength = data.length;
		const newData = data.filter((doc) => !_matchesQuery(doc, query));
		await this._saveData(newData);
		return initialLength - newData.length;
	}

	async count(query = {}) {
		return (await this.find(query)).length;
	}

	async remove() {
		const data = await this._loadData();
		const deletedCount = data.length;
		await this._saveData([]);
		return deletedCount;
	}
}

class lowstorage {
	constructor(config) {
		// _checkArgs(config);
		this._store = new S3Store(config);
	}

	collection(colName) {
		return new Collection(colName, this._store);
	}

	async listCollections() {
		const listed = await this._store.list();
		const collections = listed.filter((entry) => entry.Key.endsWith('.json'));
		return collections.map((entry) => entry.Key.split('/')[0]);
	}
}

export default lowstorage;
