'use strict';

import { S3 } from 'ultralight-s3';
import avro from 'avro-js'; // eslint-disable-line
import {
	lowstorage_ERROR_CODES,
	lowstorageError,
	CollectionNotFoundError,
	SchemaValidationError,
	DocumentValidationError,
	S3OperationError,
} from './errors.js';
import { matchesQuery, generateUUID, inferAvroType } from './helpers.js';

const MODULE_NAME = 'lowstorage';
const DEFAULT_DELIMITER = '/';
const PROJECT_DIR_PREFIX = 'lowstorage';
const COL_SUFFIX = '.avro';
const CHUNG_1MB = 1024 * 1024;
const CHUNG_5MB = 5 * CHUNG_1MB;

// code / description
// init of new collection is automatically creating it in the bucket
// there is optional (opt-in) switch to create new collections in bucket
// if the schema is not provided, it will create empty buffer and save it
// if the schema is provided, it will save it in memory and use it for all ops
// if the schema is updated, it will save it in memory and use it for all ops
// exposed functions are:
// listCollections ✅
// collectionExists ✅
// createCollection ✅
// removeCollection ✅
// renameCollection ✅
// updateCollectionSchema ❌
// collection ✅
// s3 ✅

// Operations over collections are:
// insert ✅
// find ✅
// findOne ✅
// update ✅
// updateOne ✅
// delete ✅
// count ✅

// Errors:
// lowstorageError ✅
// CollectionNotFoundError ✅
// SchemaValidationError ✅
// DocumentValidationError ✅
// S3OperationError ✅

class lowstorage {
	constructor(
		options = {
			accessKeyId: undefined,
			secretAccessKey: undefined,
			endpoint: undefined,
			bucketName: undefined,
			region: 'auto',
			logger: null,
			dirPrefix: PROJECT_DIR_PREFIX,
		},
	) {
		this._checkArgs(options);
		this._schemas = new Map();
		this._s3 = new S3(options);
		this._dirPrefix = options.dirPrefix || PROJECT_DIR_PREFIX;
		this._avro = avro;
	}

	_checkArgs = (args) => {
		const requiredFields = ['accessKeyId', 'secretAccessKey', 'endpoint', 'bucketName'];
		for (const field of requiredFields) {
			if (!args[field]) {
				throw new lowstorageError(`${MODULE_NAME}: ${field} is required`, lowstorage_ERROR_CODES.MISSING_ARGUMENT);
			}
		}
	};

	_hasColName = (colName) => {
		if (colName.trim() === '' || colName === null || typeof colName === 'undefined') {
			throw new lowstorageError(`${MODULE_NAME}: Collection name is required`, lowstorage_ERROR_CODES.MISSING_ARGUMENT);
		}
	};

	async listCollections() {
		try {
			const listed = await this._s3.list(DEFAULT_DELIMITER, this._dirPrefix);
			if (typeof listed === 'object' && listed !== null && listed.keyCount === '0') return [];
			// remove the delimiter from the key
			return listed.map((entry) => entry.key.slice(this._dirPrefix.length + 1, -COL_SUFFIX.length));
		} catch (error) {
			throw new S3OperationError(`${MODULE_NAME}: ${error.message}`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
		}
	}

	async collectionExists(colName) {
		try {
			this._hasColName(colName);
			const exists = await this._s3.fileExists(`${this._dirPrefix}${DEFAULT_DELIMITER}${colName}${COL_SUFFIX}`);
			return exists;
		} catch (error) {
			if (error.message.includes('Not Found')) {
				return false;
			}
			throw new lowstorageError(`${MODULE_NAME}: ${error.message}`, lowstorage_ERROR_CODES.COLLECTION_NOT_FOUND);
		}
	}

	async createCollection(colName, schema, data = []) {
		try {
			this._hasColName(colName);
			const exists = await this.collectionExists(colName);
			if (!exists) {
				await this._s3.put(`${this._dirPrefix}${DEFAULT_DELIMITER}${colName}${COL_SUFFIX}`, data.length > 0 ? data : '');
				return this.collection(colName, schema);
			}
			throw new lowstorageError(`${MODULE_NAME}: Collection ${colName} already exists`, lowstorage_ERROR_CODES.COLLECTION_EXISTS);
		} catch (error) {
			if (error instanceof lowstorageError) {
				throw error;
			}
			throw new lowstorageError(`${MODULE_NAME}: ${error.message}`, lowstorage_ERROR_CODES.CREATE_COLLECTION_ERROR);
		}
	}

	async removeCollection(colName) {
		try {
			this._hasColName(colName);
			const KEY = `${this._dirPrefix}${DEFAULT_DELIMITER}${colName}${COL_SUFFIX}`;
			const exists = await this.collectionExists(colName);
			if (exists) {
				await this._s3.delete(KEY);
				const exists2 = await this.collectionExists(colName);
				if (typeof exists2 === 'boolean') {
					return !exists2;
				}
				throw new S3OperationError(`${MODULE_NAME}: Failed to delete collection ${colName}`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
			}
			throw new lowstorageError(`${MODULE_NAME}: Collection ${colName} does not exist`, lowstorage_ERROR_CODES.REMOVE_COLLECTION_ERROR);
		} catch (error) {
			if (error instanceof S3OperationError) {
				throw error;
			}
			throw new lowstorageError(
				`${MODULE_NAME}: Failed to remove collection: ${error.message}`,
				lowstorage_ERROR_CODES.REMOVE_COLLECTION_ERROR,
			);
		}
	}

	async renameCollection(oldColName, newColName) {
		try {
			this._hasColName(oldColName);
			this._hasColName(newColName);
			const exists = await this.collectionExists(oldColName);
			if (!exists) {
				throw new CollectionNotFoundError(
					`${MODULE_NAME}: Collection ${oldColName} does not exist`,
					lowstorage_ERROR_CODES.COLLECTION_NOT_FOUND,
				);
			}
			const oldCol = await this.collection(oldColName);
			const oldColData = await oldCol._loadDataBuffer();
			const success = await this.removeCollection(oldColName);
			if (!success) {
				throw new lowstorageError(`${MODULE_NAME}: Failed to rename collection`, lowstorage_ERROR_CODES.RENAME_COLLECTION_ERROR);
			}
			return await this.createCollection(newColName, oldCol._avroType, oldColData);
		} catch (error) {
			if (error instanceof lowstorageError) {
				throw error;
			}
			throw new lowstorageError(
				`${MODULE_NAME}: Rename collection failed: ${error.message}`,
				lowstorage_ERROR_CODES.RENAME_COLLECTION_ERROR,
			);
		}
	}

	// TODO: update collection schema
	// async updateCollectionSchema(colName, newSchema) {
	// 	try {
	// 		this._hasColName(colName);
	// 		// Check if collection exists
	// 		const exists = await this.collectionExists(colName);
	// 		if (!exists) {
	// 			throw new CollectionNotFoundError(`${MODULE_NAME}: Collection ${colName} does not exist`, lowstorage_ERROR_CODES.COLLECTION_NOT_FOUND);
	// 		}
	// 		if (typeof schema === 'undefined' || schema === null) {
	// 			throw new lowstorageError(`${MODULE_NAME}: Schema is required`, lowstorage_ERROR_CODES.MISSING_ARGUMENT);
	// 		}
	// 		const col = this.collection(colName);
	// 		const colData = await col._loadDataBuffer();
	// 		const avroType = this._avro.parse(schema);
	// 		this._schemas.set(colName, avroType);

	// 	} catch (error) {
	// 		if (error instanceof S3OperationError) {
	// 			throw error;
	// 		}
	// 		throw new lowstorageError(
	// 			`${MODULE_NAME}: Failed to update collection schema: ${error.message}`,
	// 			lowstorage_ERROR_CODES.UPDATE_COLLECTION_SCHEMA_ERROR,
	// 		);
	// 	}
	// }

	async collection(colName, schema, autoCreate = true) {
		try {
			this._hasColName(colName);
			const colPath = `${this._dirPrefix}${DEFAULT_DELIMITER}${colName}${COL_SUFFIX}`;
			let avroType;

			const exists = await this._s3.fileExists(colPath);

			if (!exists && !autoCreate) {
				throw new lowstorageError(`${MODULE_NAME}: Collection ${colName} does not exist`, lowstorage_ERROR_CODES.COLLECTION_NOT_FOUND);
			}

			if (schema) {
				avroType = this._avro.parse(schema);
				this._schemas.set(colName, avroType);
				if (!exists && autoCreate) {
					await this._s3.put(colPath, '');
				}
			} else if (this._schemas.has(colName)) {
				avroType = this._schemas.get(colName);
			} else if (exists) {
				const schemaContent = await this._s3.get(colPath);
				avroType = this._avro.parse(schemaContent);
				this._schemas.set(colName, avroType);
			} else if (autoCreate) {
				await this._s3.put(colPath, '');
			}

			return new Collection(colName, this._s3, avroType, this._dirPrefix);
		} catch (error) {
			// check if error message contains "unknown type" and if so, throw a schema validation error
			if (error.message.includes('unknown type')) {
				throw new SchemaValidationError(
					`${MODULE_NAME}: Schema input is invalid: ${error.message}`,
					lowstorage_ERROR_CODES.SCHEMA_VALIDATION_ERROR,
				);
			}

			throw new lowstorageError(`${MODULE_NAME}: ${error.message}`, lowstorage_ERROR_CODES.COLLECTION_NOT_FOUND);
		}
	}

	s3 = () => {
		return this._s3;
	};
}

class Collection {
	constructor(colName, s3, avroType = undefined, dirPrefix = PROJECT_DIR_PREFIX) {
		this._colName = colName;
		this._s3 = s3;
		this._avro = avro;
		this._avroType = avroType;
		this._dirPrefix = dirPrefix;
	}

	async insert(doc, schema = undefined) {
		try {
			if (doc === undefined || doc === null) {
				throw new lowstorageError(`${MODULE_NAME}: Document is required for insert`, lowstorage_ERROR_CODES.INSERT_ERROR);
			}
			if (typeof doc !== 'object' && !Array.isArray(doc)) {
				throw new DocumentValidationError(
					`${MODULE_NAME}: Document must be an object or an array`,
					lowstorage_ERROR_CODES.DOCUMENT_VALIDATION_ERROR,
				);
			}
			const items = !Array.isArray(doc) ? [doc] : doc;

			const avroType = !!schema ? this._avro.parse(schema) : this._avroType || this._avro.parse(inferAvroType(doc));

			if (!avroType) {
				throw new SchemaValidationError(
					`${MODULE_NAME}: Schema is required - Pass a schema to the insert method`,
					lowstorage_ERROR_CODES.SCHEMA_VALIDATION_ERROR,
				);
			}

			this._avroType = avroType;
			const wrapperType = this._avro.parse({ type: 'array', items: this._avroType });
			const bufferData = await this._loadDataBuffer();
			const data = bufferData.length > 0 ? wrapperType.fromBuffer(bufferData) : [];
			for (let item of items) {
				if (typeof item !== 'object' || item === null) {
					throw new DocumentValidationError(
						`${MODULE_NAME}: Invalid input: input must be an object or an array of objects`,
						lowstorage_ERROR_CODES.DOCUMENT_VALIDATION_ERROR,
					);
				}
				item._id = item._id || (await generateUUID());
				const valid = this._avroType.isValid(item);
				if (!valid) {
					throw new DocumentValidationError(`${MODULE_NAME}: Invalid document or schema`, lowstorage_ERROR_CODES.DOCUMENT_VALIDATION_ERROR);
				}
				data.push(item);
			}
			const success = await this._saveDataBuffer(wrapperType.toBuffer(data));
			if (!success) {
				throw new S3OperationError(`${MODULE_NAME}: Failed to insert document`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
			}
			return items;
		} catch (error) {
			if (error.message.includes('unknown type')) {
				throw new SchemaValidationError(
					`${MODULE_NAME}: Schema input is invalid: ${error.message}`,
					lowstorage_ERROR_CODES.SCHEMA_VALIDATION_ERROR,
				);
			}
			if (error instanceof lowstorageError) {
				throw error;
			}
			throw new lowstorageError(`${MODULE_NAME} Insert operation failed: ${error.message}`, lowstorage_ERROR_CODES.INSERT_ERROR);
		}
	}

	async _loadDataBuffer() {
		try {
			const KEY = `${this._dirPrefix}${DEFAULT_DELIMITER}${this._colName}${COL_SUFFIX}`;
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
				offset += CHUNK_SIZE;
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
			throw new S3OperationError(`${MODULE_NAME}: Failed to load data buffer: ${error.message}`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
		}
	}

	async _saveDataBuffer(data) {
		try {
			const KEY = `${this._dirPrefix}${DEFAULT_DELIMITER}${this._colName}${COL_SUFFIX}`;
			const resp = await this._s3.put(KEY, data);
			if (resp.status !== 200) {
				throw new S3OperationError(`${MODULE_NAME}: Failed to save data`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
			}
			return true;
		} catch (error) {
			if (error instanceof S3OperationError) {
				throw error;
			}
			throw new lowstorageError(`${MODULE_NAME}: ${error.message}`, lowstorage_ERROR_CODES.SAVE_DATA_ERROR);
		}
	}

	async find(query = {}, options = {}) {
		try {
			if (query === undefined || query === null) {
				throw new lowstorageError(`${MODULE_NAME}: Query is required for update`, lowstorage_ERROR_CODES.MISSING_ARGUMENT);
			}
			const bufferData = await this._loadDataBuffer(); // load data from s3
			if (bufferData.length === 0) {
				return [];
			}
			const wrapperType = this._avro.parse({ type: 'array', items: this._avroType });
			const data = bufferData.length > 0 ? wrapperType.fromBuffer(bufferData) : [];
			const start = parseInt(options.skip, 10) || 0;
			const end = parseInt(options.limit, 10) ? start + parseInt(options.limit, 10) : undefined;
			const filteredData = data.filter((doc) => matchesQuery(doc, query)).slice(start, end);
			return filteredData;
		} catch (error) {
			throw new lowstorageError(`${MODULE_NAME}: Find operation failed: ${error.message}`, lowstorage_ERROR_CODES.FIND_ERROR);
		}
	}

	async findOne(query = {}) {
		try {
			if (query === undefined || query === null) {
				throw new lowstorageError(`${MODULE_NAME}: Query is required for update`, lowstorage_ERROR_CODES.MISSING_ARGUMENT);
			}
			const result = await this.find(query);
			return result[0] || [];
		} catch (error) {
			throw new lowstorageError(`${MODULE_NAME}: FindOne operation failed: ${error.message}`, lowstorage_ERROR_CODES.FIND_ONE_ERROR);
		}
	}

	async update(query = {}, update = {}) {
		try {
			if (query === undefined || query === null || update === undefined || update === null) {
				throw new lowstorageError(`${MODULE_NAME}: Query is required for update`, lowstorage_ERROR_CODES.MISSING_ARGUMENT);
			}
			if (!this._avroType) {
				throw new SchemaValidationError(
					`${MODULE_NAME}: Schema is not defined for this collection`,
					lowstorage_ERROR_CODES.SCHEMA_VALIDATION_ERROR,
				);
			}
			const bufferData = await this._loadDataBuffer(); // load data from s3
			if (bufferData.length === 0) return 0;
			const wrapperType = this._avro.parse({ type: 'array', items: this._avroType });
			const data = bufferData.length > 0 ? wrapperType.fromBuffer(bufferData) : [];
			let updatedCount = 0;

			for (let i = 0; i < data.length; i++) {
				if (matchesQuery(data[i], query)) {
					const updatedDoc = { ...data[i], ...update };
					const valid = this._avroType.isValid(updatedDoc);
					if (!valid) {
						throw new DocumentValidationError(
							`${MODULE_NAME}: Invalid document or schema`,
							lowstorage_ERROR_CODES.DOCUMENT_VALIDATION_ERROR,
						);
					}
					data[i] = updatedDoc;
					updatedCount++;
				}
			}

			if (updatedCount > 0) {
				const success = await this._saveDataBuffer(wrapperType.toBuffer(data));
				if (!success) {
					throw new S3OperationError(`${MODULE_NAME}: Failed to update document`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
				}
			}
			return updatedCount;
		} catch (error) {
			if (error instanceof S3OperationError) {
				throw error;
			}
			throw new lowstorageError(`${MODULE_NAME}: Update operation failed: ${error.message}`, lowstorage_ERROR_CODES.UPDATE_ERROR);
		}
	}

	async updateOne(query = {}, update = {}) {
		try {
			if (query === undefined || query === null || update === undefined || update === null) {
				throw new lowstorageError(`${MODULE_NAME}: Query is required`, lowstorage_ERROR_CODES.MISSING_ARGUMENT);
			}
			if (!this._avroType) {
				throw new SchemaValidationError(
					`${MODULE_NAME}: Schema is not defined for this collection`,
					lowstorage_ERROR_CODES.SCHEMA_VALIDATION_ERROR,
				);
			}
			const bufferData = await this._loadDataBuffer(); // load data from s3
			if (bufferData.length === 0) return 0;
			const wrapperType = this._avro.parse({ type: 'array', items: this._avroType });
			const data = bufferData.length > 0 ? wrapperType.fromBuffer(bufferData) : [];
			const docIndex = data.findIndex((doc) => matchesQuery(doc, query));

			if (docIndex !== -1) {
				const updatedDoc = { ...data[docIndex], ...update };
				const valid = this._avroType.isValid(updatedDoc);
				if (!valid) {
					throw new DocumentValidationError(`${MODULE_NAME}: Invalid document or schema`, lowstorage_ERROR_CODES.DOCUMENT_VALIDATION_ERROR);
				}
				data[docIndex] = updatedDoc;
				const success = await this._saveDataBuffer(wrapperType.toBuffer(data));
				if (!success) {
					throw new S3OperationError(`${MODULE_NAME}: Failed to update document`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
				}
				return 1;
			}
			return 0;
		} catch (error) {
			if (error instanceof lowstorageError) {
				throw error;
			}
			throw new lowstorageError(`${MODULE_NAME}: UpdateOne operation failed: ${error.message}`, lowstorage_ERROR_CODES.UPDATE_ONE_ERROR);
		}
	}

	async delete(query = {}) {
		try {
			if (query === undefined || query === null) {
				throw new lowstorageError(`${MODULE_NAME}: Query is required`, lowstorage_ERROR_CODES.MISSING_ARGUMENT);
			}
			const bufferData = await this._loadDataBuffer(); // load data from s3
			if (bufferData.length === 0) return 0;
			const wrapperType = this._avro.parse({ type: 'array', items: this._avroType });
			const data = bufferData.length > 0 ? wrapperType.fromBuffer(bufferData) : [];
			const initialLength = data.length;
			const newData = data.filter((doc) => !matchesQuery(doc, query));
			const success = await this._saveDataBuffer(wrapperType.toBuffer(newData));
			if (!success) {
				throw new S3OperationError(`${MODULE_NAME}: Failed to delete document`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
			}
			return initialLength - newData.length;
		} catch (error) {
			if (error instanceof S3OperationError) {
				throw error;
			}
			throw new lowstorageError(`${MODULE_NAME}: Delete operation failed: ${error.message}`, lowstorage_ERROR_CODES.DELETE_ERROR);
		}
	}

	async deleteAll() {
		try {
			const bufferData = await this._loadDataBuffer(); // load data from s3
			if (bufferData.length === 0) return 0;
			const wrapperType = this._avro.parse({ type: 'array', items: this._avroType });
			const data = bufferData.length > 0 ? wrapperType.fromBuffer(bufferData) : [];
			const initialLength = data.length;
			const newData = data.filter((doc) => !matchesQuery(doc, {}));
			const success = await this._saveDataBuffer(wrapperType.toBuffer(newData));
			if (!success) {
				throw new S3OperationError(`${MODULE_NAME}: Failed to delete document`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
			}
			return initialLength - newData.length;
		} catch (error) {
			if (error instanceof S3OperationError) {
				throw error;
			}
			throw new lowstorageError(`${MODULE_NAME}: Delete operation failed: ${error.message}`, lowstorage_ERROR_CODES.DELETE_ERROR);
		}
	}

	async count(query = {}) {
		try {
			if (Object.keys(query).length === 0) {
				const bufferData = await this._loadDataBuffer(); // load data from s3
				if (bufferData.length === 0) return 0;
				const wrapperType = this._avro.parse({ type: 'array', items: this._avroType });
				return wrapperType.fromBuffer(bufferData).length || 0;
			}
			return (await this.find(query)).length;
		} catch (error) {
			throw new lowstorageError(`${MODULE_NAME}: Count operation failed: ${error.message}`, lowstorage_ERROR_CODES.COUNT_ERROR);
		}
	}
}

// export default lowstorage;
export { lowstorage, lowstorageError, lowstorage_ERROR_CODES };
