'use strict';

import { S3 } from 'ultralight-s3';
import avro from 'avro-js'; // eslint-disable-line
import { matchesQuery, generateUUID, inferAvroType } from './helpers.js';

const MODULE_NAME = 'lowstorage';
const PROJECT_DIR_PREFIX = 'lowstorage/';
const SCHEMA_SUFFIX = '.avro';
const CHUNG_1MB = 1024 * 1024;
const CHUNG_5MB = 5 * CHUNG_1MB;

class lowstorage {
	constructor(
		options = {
			accessKeyId: undefined,
			secretAccessKey: undefined,
			endpoint: undefined,
			bucketName: undefined,
			region: 'auto',
			logger: null,
		},
	) {
		this._checkArgs(options);
		this._schemas = new Map();
		this._s3 = new S3(options);
		this._avro = avro;
	}

	_checkArgs = (args) => {
		const requiredFields = ['accessKeyId', 'secretAccessKey', 'endpoint', 'bucketName'];
		for (const field of requiredFields) {
			if (!args[field]) {
				throw new Error(`${MODULE_NAME}: ${field} is required`);
			}
		}
	};

	async listCollections() {
		const listed = await this._s3.list(PROJECT_DIR_PREFIX, '', 1000);
		return listed.map((entry) => entry.key.slice(PROJECT_DIR_PREFIX.length, -SCHEMA_SUFFIX.length));
	}

	async createCollection(colName, schema = undefined) {
		try {
			if (colName === undefined || colName.trim() === '' || colName === null) {
				throw new Error(`${MODULE_NAME}: Collection name is required`);
			}
			if (await this.collectionExists(colName)) {
				throw new Error(`${MODULE_NAME}: Collection ${colName} already exists`);
			}
			if (schema) {
				const avroType = this._avro.parse(schema);
				this._schemas.set(colName, avroType);
			}
			return this.collection(colName, schema);
		} catch (error) {
			throw new Error(`${MODULE_NAME}: ${error.message}`);
		}
	}

	async removeCollection(colName) {
		try {
			const exists = await this._s3.fileExists(`${PROJECT_DIR_PREFIX}${colName}${SCHEMA_SUFFIX}`);
			if (exists) {
				const resp = await this._s3.delete(`${PROJECT_DIR_PREFIX}${colName}${SCHEMA_SUFFIX}`);
				if (resp.status === 200) {
					return true;
				}
				return false;
			}
			return true;
		} catch (error) {
			throw new Error(`${MODULE_NAME}: ${error.message}`);
		}
	}

	async collectionExists(colName) {
		try {
			const exists = await this._s3.fileExists(`${PROJECT_DIR_PREFIX}${colName}${SCHEMA_SUFFIX}`);
			return exists;
		} catch (error) {
			if (error.message.includes('Not Found')) {
				return false;
			}
			throw new Error(`${MODULE_NAME}: ${error.message}`);
		}
	}

	async updateCollectionSchema(colName, schema) {
		try {
			if (colName === undefined || colName.trim() === '' || colName === null) {
				throw new Error(`${MODULE_NAME}: Collection name is required`);
			}
			// Check if collection exists
			const exists = await this.collectionExists(colName);
			if (!exists) {
				throw new Error(`${MODULE_NAME}: Collection ${colName} does not exist`);
			}
			if (schema === undefined || schema === null) {
				throw new Error(`${MODULE_NAME}: Schema is required`);
			}
			const avroType = this._avro.parse(schema);
			this._schemas.set(colName, avroType);
			const resp = await this._s3.put(`${PROJECT_DIR_PREFIX}${colName}${SCHEMA_SUFFIX}`, JSON.stringify(schema));
			if (resp.status === 200) {
				return true;
			} else {
				throw new Error(`${MODULE_NAME}: Failed to update schema for collection ${colName}`);
			}
		} catch (error) {
			throw new Error(`${MODULE_NAME}: ${error.message}`);
		}
	}

	async collection(colName, schema = undefined) {
		try {
			if (colName === undefined || colName.trim() === '' || colName === null) {
				throw new Error(`${MODULE_NAME}: Collection name is required`);
			}
			if (typeof schema === 'undefined') {
				// Load schema if not in memory
				if (this._schemas.has(colName)) {
					return new Collection(colName, this._s3, this._schemas.get(colName));
				}
				// check if schema file exists
				const exists = await this._s3.fileExists(`${PROJECT_DIR_PREFIX}${colName}${SCHEMA_SUFFIX}`);
				if (exists) {
					const schemaContent = await this._s3.get(`${PROJECT_DIR_PREFIX}${colName}${SCHEMA_SUFFIX}`);

					const avroType = this._avro.parse(schemaContent);
					this._schemas.set(colName, avroType);
					return new Collection(colName, this._s3, avroType);
				}
				return new Collection(colName, this._s3, undefined);
			}
			return new Collection(colName, this._s3, this._avro.parse(schema));
		} catch (error) {
			throw new Error(`${MODULE_NAME}: ${error.message}`);
		}
	}
}

class Collection {
	constructor(colName, s3, avroType = undefined) {
		this._colName = colName;
		this._s3 = s3;
		this._avro = avro;
		this._avroType = avroType;
	}

	async insert(doc, schema = undefined) {
		try {
			if (doc === undefined || doc === null) {
				throw new Error(`${MODULE_NAME}: Document is required for insert`);
			}
			if (typeof doc !== 'object' && !Array.isArray(doc)) {
				throw new Error(`${MODULE_NAME}: Document must be an object or an array`);
			}
			const items = !Array.isArray(doc) ? [doc] : doc;

			const avroType = !!schema ? this._avro.parse(schema) : this._avroType || this._avro.parse(inferAvroType(doc));

			// throw new Error('avroType::: ', avroType);
			if (avroType === undefined) {
				throw new Error(`${MODULE_NAME}: Schema is required - Pass a schema to the insert method`);
			}
			this._avroType = avroType;
			const wrapperType = this._avro.parse({ type: 'array', items: this._avroType });
			const bufferData = await this._loadDataBuffer();
			const data = bufferData.length > 0 ? wrapperType.fromBuffer(bufferData) : [];
			for (let item of items) {
				if (typeof item !== 'object' || item === null) {
					throw new Error('Invalid input: input must be an object or an array of objects');
				}
				item._id = item._id || (await generateUUID());
				const valid = this._avroType.isValid(item);
				if (!valid) {
					throw new Error(`${MODULE_NAME}: Invalid document or schema`);
				}
				data.push(item);
			}
			const resp = await this._saveDataBuffer(wrapperType.toBuffer(data));
			if (resp) {
				return items;
			} else {
				throw new Error(`${MODULE_NAME}: Failed to insert document`);
			}
		} catch (error) {
			throw new Error(`${MODULE_NAME}: ${error.message}`);
		}
	}

	async _loadDataBuffer() {
		try {
			const KEY = `${PROJECT_DIR_PREFIX}${this._colName}${SCHEMA_SUFFIX}`;
			const CHUNK_SIZE = this._s3.getMaxRequestSizeInBytes() || CHUNG_5MB;
			let firstData = await this._s3.get(KEY);
			if (firstData.length < CHUNK_SIZE) {
				return Buffer.from(firstData, 'utf8');
			}
			let offset = CHUNK_SIZE;
			let bufferArr = [Buffer.from(firstData, 'utf8')];
			let repeat = true;
			while (repeat) {
				const nextDataResponse = await this._s3.getResponse(KEY, false, offset, offset + CHUNK_SIZE);
				const nextDataBody = await nextDataResponse.text();
				bufferArr.push(Buffer.from(nextDataBody, 'utf8'));
				offset += CHUNG;
				const contentLength = nextDataResponse.headers.get('content-length') || nextDataBody.length;
				if (contentLength < CHUNK_SIZE) {
					repeat = false;
				}
			}
			return Buffer.concat(bufferArr);
		} catch (error) {
			if (error.toString().indexOf('status 404: Unknown - Not Found') > -1) {
				return Buffer.from('');
			}
			throw new Error(`${MODULE_NAME}: ${error.message}`);
		}
	}

	async _saveDataBuffer(data) {
		try {
			const KEY = `${PROJECT_DIR_PREFIX}${this._colName}${SCHEMA_SUFFIX}`;
			const resp = await this._s3.put(KEY, data);
			if (resp.status === 200) {
				return true;
			} else {
				throw new Error(`${MODULE_NAME}: Failed to save data`);
			}
		} catch (error) {
			throw new Error(`${MODULE_NAME}: ${error.message}`);
		}
	}

	async find(query = {}, options = {}) {
		try {
			const bufferData = await this._loadDataBuffer(); // load data from s3
			const wrapperType = this._avro.parse({ type: 'array', items: this._avroType });
			const data = bufferData.length > 0 ? wrapperType.fromBuffer(bufferData) : [];
			const start = parseInt(options.skip, 10) || 0;
			const end = parseInt(options.limit, 10) ? start + parseInt(options.limit, 10) : undefined;
			const filteredData = data.filter((doc) => matchesQuery(doc, query)).slice(start, end);
			return filteredData;
		} catch (error) {
			throw new Error(`${MODULE_NAME}: ${error.message}`);
		}
	}

	async findOne(query = {}) {
		return (await this.find(query))[0] || null;
	}

	async update(query = {}, update = {}) {
		try {
			const bufferData = await this._loadDataBuffer(); // load data from s3
			const wrapperType = this._avro.parse({ type: 'array', items: this._avroType });
			const data = bufferData.length > 0 ? wrapperType.fromBuffer(bufferData) : [];
			let updatedCount = 0;

			for (let i = 0; i < data.length; i++) {
				if (matchesQuery(data[i], query)) {
					Object.assign(data[i], update);
					updatedCount++;
				}
			}

			if (updatedCount > 0) {
				const resp = await this._saveDataBuffer(wrapperType.toBuffer(data));
				if (resp) {
					return updatedCount;
				}
			}
			return 0;
		} catch (error) {
			throw new Error(`${MODULE_NAME}: ${error.message}`);
		}
	}

	async updateOne(query = {}, update = {}) {
		try {
			const bufferData = await this._loadDataBuffer(); // load data from s3
			const wrapperType = this._avro.parse({ type: 'array', items: this._avroType });
			const data = bufferData.length > 0 ? wrapperType.fromBuffer(bufferData) : [];
			const docIndex = data.findIndex((doc) => matchesQuery(doc, query));

			if (docIndex !== -1) {
				Object.assign(data[docIndex], update);
				const resp = await this._saveDataBuffer(wrapperType.toBuffer(data));
				if (resp) {
					return 1;
				}
			}
			return 0;
		} catch (error) {
			throw new Error(`${MODULE_NAME}: ${error.message}`);
		}
	}

	async delete(query = {}) {
		try {
			const bufferData = await this._loadDataBuffer(); // load data from s3
			const wrapperType = this._avro.parse({ type: 'array', items: this._avroType });
			const data = bufferData.length > 0 ? wrapperType.fromBuffer(bufferData) : [];
			const initialLength = data.length;
			const newData = data.filter((doc) => !matchesQuery(doc, query));
			const resp = await this._saveDataBuffer(wrapperType.toBuffer(newData));
			if (resp) {
				return initialLength - newData.length;
			}
			return 0;
		} catch (error) {
			throw new Error(`${MODULE_NAME}: ${error.message}`);
		}
	}

	async count(query = {}) {
		try {
			if (query === undefined || query === null) {
				throw new Error(`${MODULE_NAME}: Query is required`);
			}
			if (Object.keys(query).length === 0) {
				const bufferData = await this._loadDataBuffer(); // load data from s3
				const wrapperType = this._avro.parse({ type: 'array', items: this._avroType });
				const data = bufferData.length > 0 ? wrapperType.fromBuffer(bufferData) : [];
				return data.length || null;
			}
			return (await this.find(query)).length;
		} catch (error) {
			throw new Error(`${MODULE_NAME}: ${error.message}`);
		}
	}
}

export default lowstorage;
export { lowstorage };
