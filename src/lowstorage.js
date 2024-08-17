'use strict';

import { S3 } from 'ultralight-s3';
import avro from 'avsc'; // eslint-disable-line
import {
	lowstorage_ERROR_CODES,
	lowstorageError,
	CollectionNotFoundError,
	SchemaValidationError,
	DocumentValidationError,
	S3OperationError,
} from './errors.js';
import { matchesQuery, generateUUID, inferAvroType, ensureIdFieldInSchema } from './helpers.js';

const MODULE_NAME = 'lowstorage';
const DEFAULT_DELIMITER = '/';
const PROJECT_DIR_PREFIX = 'lowstorage';
const COL_SUFFIX = '.avro';
const CHUNG_1MB = 1024 * 1024;
const CHUNG_5MB = 5 * CHUNG_1MB;
const EMPTY_DATA = Buffer.from('', 'utf8');

const errorValidationFn = (errorCode = lowstorage_ERROR_CODES.DOCUMENT_VALIDATION_ERROR) => {
	throw new DocumentValidationError(`${MODULE_NAME}: Invalid document or schema`, errorCode);
};

const _hasColName = (colName) => {
	if (colName.trim() === '' || colName === null || typeof colName === 'undefined' || colName.length > 255 || colName === null) {
		throw new lowstorageError(`${MODULE_NAME}: Collection name is required, null or too long`, lowstorage_ERROR_CODES.MISSING_ARGUMENT);
	}
};

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

/**
 * lowstorage class for managing collections and performing operations on top of S3-compatible storages.
 * @class
 * @example
 * const storage = new lowstorage({
 * 	accessKeyId: 'YOUR_ACCESS_KEY',
 * 	secretAccessKey: 'YOUR_SECRET_KEY',
 * 	endpoint: 'YOUR_ENDPOINT',
 * 	bucketName: 'YOUR_BUCKET_NAME',
 * 	region: 'YOUR_REGION',
 * });
 *
 * // Create a collection
 * const userCol = await storage.collection('users');
 *
 * // Insert a document
 * await userCol.insert({
 * 	name: 'Kevin',
 * 	gender: 'whatever',
 * 	posts: [],
 * });
 *
 * // Show all users
 * const allUsers = await userCol.find({});
 *
 * // Find users with pagination (e.g., page 2, 10 users per page)
 * const secondPageUsers = await userCol.find({}, { skip: 10, limit: 10 });
 *
 * // Find user by ID and update name
 * await userCol.update({ _id: id }, { name: 'Carlos' });
 */
class lowstorage {
	/**
	 * Create a new lowstorage instance.
	 * @param {Object} options - Configuration options for lowstorage.
	 * @param {string} options.accessKeyId - S3 access key ID.
	 * @param {string} options.secretAccessKey - S3 secret access key.
	 * @param {string} options.endpoint - S3 endpoint URL.
	 * @param {string} options.bucketName - S3 bucket name.
	 * @param {string} [options.region='auto'] - S3 region.
	 * @param {Object} [options.logger=null] - Logger object.
	 * @param {string} [options.dirPrefix=PROJECT_DIR_PREFIX] - Directory prefix for collections.
	 * @param {Number} [options.maxRequestSizeInBytes=CHUNG_5MB] - Chunk size for reading and writing data. AWS S3 has a minimum of 5MB per object.
	 * @returns {lowstorage} A new lowstorage instance.
	 */
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

	/**
	 * List all collections.
	 * @returns {Promise<string[]>} An array of collection names.
	 * @throws {S3OperationError} If there's an error during S3 operation.
	 */
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

	/**
	 * Check if a collection exists.
	 * @param {string} colName - The name of the collection.
	 * @returns {Promise<boolean>} True if the collection exists, false otherwise.
	 * @throws {lowstorageError} If there's an error.
	 */
	async collectionExists(colName) {
		try {
			_hasColName(colName);
			const exists = await this._s3.fileExists(`${this._dirPrefix}${DEFAULT_DELIMITER}${colName}${COL_SUFFIX}`);
			return !!exists;
		} catch (error) {
			if (error.message.includes('Not Found')) {
				return false;
			}
			throw new lowstorageError(`${MODULE_NAME}: ${error.message}`, lowstorage_ERROR_CODES.COLLECTION_NOT_FOUND);
		}
	}

	/**
	 * Create a new collection.
	 * @param {string} colName - The name of the collection.
	 * @param {Object} [schema] - The schema for the collection.
	 * @param {Array} [data=[]] - The initial data for the collection.
	 * @returns {Promise<Collection>} A Promise that resolves to a Collection object.
	 * @throws {lowstorageError} If there's an error.
	 */
	async createCollection(colName, schema, data = []) {
		try {
			_hasColName(colName);
			const exists = await this.collectionExists(colName);
			if (!exists) {
				if (typeof schema !== 'undefined' && schema !== null) {
					try {
						const isValid = this._avro.parse(schema);
						if (!isValid) {
							throw new SchemaValidationError(
								`${MODULE_NAME}: Schema is invalid: ${schema}`,
								lowstorage_ERROR_CODES.SCHEMA_VALIDATION_ERROR,
							);
						}
					} catch (error) {
						throw new SchemaValidationError(`${MODULE_NAME}: Schema is invalid: ${schema}`, lowstorage_ERROR_CODES.SCHEMA_VALIDATION_ERROR);
					}
				}
				if (data.length > 0 && schema) {
					const wrapperType = this._avro.parse({ type: 'array', items: schema });
					await this._s3.put(`${this._dirPrefix}${DEFAULT_DELIMITER}${colName}${COL_SUFFIX}`, wrapperType.toBuffer(data));
				} else {
					await this._s3.put(`${this._dirPrefix}${DEFAULT_DELIMITER}${colName}${COL_SUFFIX}`, EMPTY_DATA);
				}
				return this.collection(colName, schema, false);
			}
			throw new lowstorageError(`${MODULE_NAME}: Collection ${colName} already exists`, lowstorage_ERROR_CODES.COLLECTION_EXISTS);
		} catch (error) {
			if (error instanceof lowstorageError) {
				throw error;
			}
			throw new lowstorageError(`${MODULE_NAME}: ${error.message}`, lowstorage_ERROR_CODES.CREATE_COLLECTION_ERROR);
		}
	}

	/**
	 * Remove a collection.
	 * @param {string} colName - The name of the collection.
	 * @returns {Promise<boolean>} A Promise that resolves to true if the collection is removed, false otherwise.
	 * @throws {lowstorageError} If there's an error.
	 */
	async removeCollection(colName) {
		try {
			_hasColName(colName);
			const exists = await this.collectionExists(colName);
			if (exists) {
				await this._s3.delete(`${this._dirPrefix}${DEFAULT_DELIMITER}${colName}${COL_SUFFIX}`);
				const exists2 = await this.collectionExists(colName);
				if (typeof exists2 === 'boolean') {
					if (!exists2) {
						this._schemas.delete(colName);
						return true;
					}
					throw new lowstorageError(`${MODULE_NAME}: Failed to delete collection ${colName}`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
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

	/**
	 * Get or create a collection.
	 * @param {string} colName - The name of the collection.
	 * @param {Object} [schema] - The schema for the collection.
	 * @param {boolean} [autoCreate=true] - Whether to automatically create the collection if it doesn't exist.
	 * @returns {Promise<Collection>} A Promise that resolves to a Collection object.
	 * @throws {lowstorageError} If there's an error.
	 */
	async collection(colName, schema, autoCreate = true) {
		try {
			_hasColName(colName);
			const colPath = `${this._dirPrefix}${DEFAULT_DELIMITER}${colName}${COL_SUFFIX}`;
			const exists = await this._s3.fileExists(colPath);
			if (!exists) {
				if (!autoCreate) {
					throw new lowstorageError(`${MODULE_NAME}: Collection ${colName} does not exist`, lowstorage_ERROR_CODES.COLLECTION_NOT_FOUND);
				}
				// TODO: check if this is the right way to handle empty data
				await this._s3.put(colPath, EMPTY_DATA);
			}
			const colSchema = schema || this._schemas.get(colName) || undefined;
			return new Collection(colName, colSchema, this._s3, this._dirPrefix);
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

	/**
	 * Get the S3 instance associated with the lowstorage instance.
	 * @returns {S3} The S3 instance. Use this to perform S3 operations. Check for ultralight-s3 for more details.
	 */
	s3 = () => {
		return this._s3;
	};
}

/**
 * Collection class for managing documents in a collection.
 * @class
 * @example
 * const storage = new lowstorage({
 * 	accessKeyId: 'YOUR_ACCESS_KEY',
 * 	secretAccessKey: 'YOUR_SECRET_KEY',
 * 	endpoint: 'YOUR_ENDPOINT',
 * 	bucketName: 'YOUR_BUCKET_NAME',
 * 	region: 'YOUR_REGION',
 * });
 *
 * // Create a collection
 * const userCol = await storage.collection('users');
 *
 * // Insert a document
 * await userCol.insert({
 * 	name: 'Kevin',
 * 	gender: 'whatever',
 * 	posts: [],
 * });
 *
 * // Show all users
 * const allUsers = await userCol.find({});
 *
 * // Find users with pagination (e.g., page 2, 10 users per page)
 * const secondPageUsers = await userCol.find({}, { skip: 10, limit: 10 });
 *
 * // Find user by ID and update name
 * await userCol.update({ _id: id }, { name: 'Carlos' });
 */
class Collection {
	/**
	 * Create a new Collection instance.
	 * @param {string} colName - The name of the collection.
	 * @param {Object} [schema] - The Avro schema for the collection.
	 * @param {S3} s3 - The S3 instance.
	 * @param {string} [dirPrefix=PROJECT_DIR_PREFIX] - The directory prefix for the collection.
	 * @param {boolean} [safeWrite=false] - Whether to perform a safe write operation. It doublechecks the ETag of the object before writing. False = overwrites the object, True = only writes if the object has not been modified.
	 * @param {Number} [chunkSize=CHUNG_5MB] - The chunk size for reading and writing data. AWS S3 has a maximum of 5MB per object.
	 * @returns {Collection} A new Collection instance.
	 */
	constructor(colName, schema, s3, dirPrefix = PROJECT_DIR_PREFIX, safeWrite = false, chunkSize = CHUNG_5MB) {
		this._colName = colName;
		this._s3 = s3;
		this._schema = ensureIdFieldInSchema(schema);
		this._dirPrefix = dirPrefix;
		this._safeWrite = safeWrite;
		this._chunkSize = chunkSize || CHUNG_5MB;
		this._key = `${this._dirPrefix}${DEFAULT_DELIMITER}${this._colName}${COL_SUFFIX}`;
		this._s3.setMaxRequestSizeInBytes(this._chunkSize);
		this._avro = avro;
		this._lastETag = '';
		this._dataCache = [];
		this._avroType = typeof schema === 'undefined' ? null : this._avro.parse(schema);
	}

	getProps = () => ({
		colName: this._colName,
		schema: this._schema,
		s3: this._s3,
		avro: this._avro,
		avroType: this._avroType,
		dirPrefix: this._dirPrefix,
		safeWrite: this._safeWrite,
		chunkSize: this._chunkSize,
	});

	setProps = (props) => {
		this._colName = props.colName;
		this._schema = props.schema;
		this._s3 = props.s3;
		this._avro = props.avro;
		this._avroType = props.avroType;
		this._dirPrefix = props.dirPrefix;
		this._safeWrite = props.safeWrite;
		this._chunkSize = props.chunkSize;
	};

	setSafeWrite = (safeWrite) => {
		this._safeWrite = safeWrite;
	};

	getSafeWrite = () => {
		return this._safeWrite;
	};

	getAvroSchema = () => {
		return this._schema;
	};

	setAvroSchema = (schema) => {
		this._schema = ensureIdFieldInSchema(schema);
		this._avroType = typeof schema === 'undefined' ? null : this._avro.parse(schema);
	};

	async _loadData() {
		try {
			if (this._avroType === null || typeof this._avroType === 'undefined') {
				throw new lowstorageError(
					`${MODULE_NAME}: Missing type definition. Configure before operations `,
					lowstorage_ERROR_CODES.SCHEMA_VALIDATION_ERROR,
				);
			}
			const { etag, data } = await this._s3.getObjectWithETag(this._key, { 'if-none-match': this._lastETag });
			if (data === null) {
				return this._dataCache;
			}
			this._lastETag = etag === null ? this._lastETag : etag;
			const wrapperType = this._avro.parse({ type: 'array', items: this._avroType });
			if (data.length < this._chunkSize) {
				this._dataCache = data.length > 0 ? wrapperType.fromBuffer(Buffer.from(data, 'utf8')) : [];
				return this._dataCache;
			}
			let offset = this._chunkSize;
			let bufferArr = [Buffer.from(data, 'utf8')];
			let repeat = true;
			while (repeat) {
				const nextDataResponse = await this._s3.getResponse(this._key, false, offset, offset + this._chunkSize);
				const nextDataBody = await nextDataResponse.text();
				bufferArr.push(Buffer.from(nextDataBody, 'utf8'));
				offset += this._chunkSize;
				const contentLength = nextDataResponse.headers.get('content-length') || nextDataBody.length;
				if (contentLength < this._chunkSize) {
					repeat = false;
				}
			}
			const bufferedData = Buffer.concat(bufferArr);
			this._dataCache = wrapperType.fromBuffer(bufferedData);
			return this._dataCache;
		} catch (error) {
			if (error.toString().indexOf('status 404: Unknown - Not Found') > -1) {
				this._dataCache = [];
				return this._dataCache;
			}
			throw new S3OperationError(`${MODULE_NAME}: Failed to load data: ${error.message}`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
		}
	}

	async _saveData(data) {
		try {
			if (this._avroType === null || typeof this._avroType === 'undefined') {
				throw new lowstorageError(
					`${MODULE_NAME}: Missing type definition. Configure before operations `,
					lowstorage_ERROR_CODES.SCHEMA_VALIDATION_ERROR,
				);
			}
			const wrapperType = this._avro.parse({ type: 'array', items: this._avroType });
			const dataBuffer = data.length > 0 ? wrapperType.toBuffer(data) : EMPTY_DATA; // TODO: check if this is the right way to handle empty data

			if (this._safeWrite && this._lastETag !== '') {
				const currentETag = await this._s3.getEtag(this._key);
				// If we have a current ETag, check if it matches our last known ETag
				if (currentETag !== null && currentETag !== this._lastETag) {
					return false;
				}
			}

			const resp = await this._s3.put(this._key, dataBuffer);
			if (resp.status !== 200) {
				throw new S3OperationError(`${MODULE_NAME}: Failed to save data`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
			}

			// Update the cached ETag
			const newETag = resp.headers.get('etag');
			if (newETag) {
				this._lastETag = this._s3.sanitizeETag(newETag);
				this._dataCache = data;
			}
			return true;
		} catch (error) {
			if (error instanceof S3OperationError) {
				throw error;
			}
			throw new lowstorageError(`${MODULE_NAME}: ${error.message}`, lowstorage_ERROR_CODES.SAVE_DATA_ERROR);
		}
	}

	/**
	 * Insert a document into the collection.
	 * @param {Object|Array} doc - The document to insert.
	 * @param {Object} [schema=undefined] - The schema for the document.
	 * @returns {Promise<Array>} A Promise that resolves to the array of inserted document(s).
	 * @throws {lowstorageError} If there's an error.
	 */
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

			const schemaWithId = ensureIdFieldInSchema(schema) || this._schema || inferAvroType(items[0]);
			const avroType = this._avro.parse(schemaWithId);
			if (!avroType) {
				throw new SchemaValidationError(
					`${MODULE_NAME}: Schema is required - Pass a schema to the insert method`,
					lowstorage_ERROR_CODES.SCHEMA_VALIDATION_ERROR,
				);
			}
			this._avroType = avroType;
			const data = await this._loadData();
			for (let item of items) {
				if (typeof item !== 'object' || item === null) {
					throw new DocumentValidationError(
						`${MODULE_NAME}: Invalid input: input must be an object or an array of objects`,
						lowstorage_ERROR_CODES.DOCUMENT_VALIDATION_ERROR,
					);
				}
				item._id = item._id || (await generateUUID());
				const validBuffer = this._avroType.isValid(item, {
					errorHook: errorValidationFn,
					noUndeclaredFields: true,
				});
				if (validBuffer === true) {
					data.push(item);
				} else {
					throw new DocumentValidationError(`${MODULE_NAME}: Invalid document or schema`, lowstorage_ERROR_CODES.DOCUMENT_VALIDATION_ERROR);
				}
			}
			const success = await this._saveData(data);
			if (!success) {
				throw new S3OperationError(`${MODULE_NAME}: Failed to insert document`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
			}
			this.setAvroSchema(schemaWithId);
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

	/**
	 * Find documents in the collection.
	 * @param {Object} [query={}] - The query to filter documents.
	 * @param {Object} [options={}] - The options for pagination.
	 * @param {number} [options.skip=0] - The number of documents to skip. Default is 0.
	 * @param {number} [options.limit=undefined] - The maximum number of documents to return. Default is undefined, which means no limit.
	 * @returns {Promise<Array>} A Promise that resolves to an array of matching documents.
	 * @throws {lowstorageError} If there's an error.
	 */
	async find(query = {}, options = {}) {
		try {
			if (query === undefined || query === null) {
				throw new lowstorageError(`${MODULE_NAME}: Query is required for update`, lowstorage_ERROR_CODES.MISSING_ARGUMENT);
			}
			const data = await this._loadData();
			const start = parseInt(options.skip, 10) || 0;
			const end = parseInt(options.limit, 10) ? start + parseInt(options.limit, 10) : undefined;
			const filteredData = data.filter((doc) => matchesQuery(doc, query)).slice(start, end);
			return filteredData;
		} catch (error) {
			throw new lowstorageError(`${MODULE_NAME}: Find operation failed: ${error.message}`, lowstorage_ERROR_CODES.FIND_ERROR);
		}
	}

	/**
	 * Find the first document in the collection that matches the query.
	 * @param {Object} [query={}] - The query to filter documents.
	 * @returns {Promise<Object|null>} A Promise that resolves to the first matching document or null if no match is found.
	 * @throws {lowstorageError} If there's an error.
	 */
	async findOne(query = {}) {
		try {
			if (query === null) {
				throw new lowstorageError(`${MODULE_NAME}: Query cannot be null`, lowstorage_ERROR_CODES.INVALID_ARGUMENT);
			}
			const result = await this.find(query, { limit: 1 });
			return result[0] || null;
		} catch (error) {
			if (error instanceof lowstorageError) {
				throw error;
			}
			throw new lowstorageError(`${MODULE_NAME}: FindOne operation failed: ${error.message}`, lowstorage_ERROR_CODES.FIND_ONE_ERROR);
		}
	}

	/**
	 * Update a single document in the collection that matches the query.
	 * @param {Object} [query={}] - The query to filter the document to update.
	 * @param {Object} [update={}] - The update operations to apply to the matching document.
	 * @returns {Promise<number>} A Promise that resolves to number of documents updated.
	 * @throws {lowstorageError} If the updateOne operation fails.
	 * @throws {SchemaValidationError} If the schema is not defined for the collection.
	 * @throws {DocumentValidationError} If the updated document is invalid.
	 * @throws {S3OperationError} If the S3 operation fails.
	 */
	async update(query = {}, update = {}, options = {}) {
		try {
			if (query === undefined || query === null || update === undefined || update === null) {
				throw new lowstorageError(
					`${MODULE_NAME}: Query and update values are required for update`,
					lowstorage_ERROR_CODES.MISSING_ARGUMENT,
				);
			}
			if (!this._avroType) {
				throw new SchemaValidationError(
					`${MODULE_NAME}: Schema is not defined for this collection`,
					lowstorage_ERROR_CODES.SCHEMA_VALIDATION_ERROR,
				);
			}
			const data = await this._loadData();
			if (data.length === 0) return 0;
			let updatedCount = 0;
			for (let i = 0; i < data.length; i++) {
				if (matchesQuery(data[i], query)) {
					const updatedDoc = { ...data[i], ...update };
					const isValid = this._avroType.isValid(updatedDoc, {
						errorHook: errorValidationFn,
						noUndeclaredFields: true,
					});
					if (isValid === true) {
						data[i] = updatedDoc;
						updatedCount++;
					} else {
						throw new DocumentValidationError(
							`${MODULE_NAME}: Invalid document or schema`,
							lowstorage_ERROR_CODES.DOCUMENT_VALIDATION_ERROR,
						);
					}
				}
			}

			if (updatedCount > 0) {
				const success = await this._saveData(data);
				if (!success) {
					throw new S3OperationError(`${MODULE_NAME}: Failed to update document`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
				}
			} else if (options.upsert) {
				// If upsert is true, we need to insert the document
				const success = await this.insert(update);
				if (!success) {
					throw new S3OperationError(`${MODULE_NAME}: Failed to update document`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
				}
				updatedCount = 1;
			}
			return updatedCount;
		} catch (error) {
			if (error instanceof S3OperationError) {
				throw error;
			}
			throw new lowstorageError(`${MODULE_NAME}: Update operation failed: ${error.message}`, lowstorage_ERROR_CODES.UPDATE_ERROR);
		}
	}

	/**
	 * Update a single document in the collection that matches the query.
	 * @param {Object} [query={}] - The query to filter the document to update.
	 * @param {Object} [update={}] - The update operations to apply to the matching document.
	 * @returns {Promise<number>} A Promise that resolves to 1 if a document was updated, 0 otherwise.
	 * @throws {lowstorageError} If the updateOne operation fails.
	 * @throws {SchemaValidationError} If the schema is not defined for the collection.
	 * @throws {DocumentValidationError} If the updated document is invalid.
	 * @throws {S3OperationError} If the S3 operation fails.
	 */
	async updateOne(query = {}, update = {}, options = {}) {
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
			const data = await this._loadData();
			if (data.length === 0) return 0;
			const docIndex = data.findIndex((doc) => matchesQuery(doc, query));

			if (docIndex !== -1) {
				const updatedDoc = { ...data[docIndex], ...update };
				const isValid = this._avroType.isValid(updatedDoc, {
					errorHook: errorValidationFn,
					noUndeclaredFields: true,
				});
				if (isValid === true) {
					data[docIndex] = updatedDoc;
					const success = await this._saveData(data);
					if (!success) {
						throw new S3OperationError(`${MODULE_NAME}: Failed to update document`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
					}
					return 1;
				} else {
					throw new DocumentValidationError(`${MODULE_NAME}: Invalid document or schema`, lowstorage_ERROR_CODES.DOCUMENT_VALIDATION_ERROR);
				}
			}
			if (options.upsert) {
				// If upsert is true, we need to insert the document
				const success = await this.insert(update);
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

	/**
	 * Delete documents from the collection.
	 * @param {Object} [query={}] - The query to filter documents to delete.
	 * @returns {Promise<number>} A Promise that resolves to the number of documents deleted.
	 * @throws {lowstorageError} If the delete operation fails.
	 * @throws {S3OperationError} If the S3 operation fails.
	 */
	async delete(query = {}) {
		try {
			if (query === undefined || query === null) {
				throw new lowstorageError(`${MODULE_NAME}: Query is required`, lowstorage_ERROR_CODES.MISSING_ARGUMENT);
			}
			const data = await this._loadData();
			if (data.length === 0) return 0;
			const initialLength = data.length;

			const newData = data.filter((doc) => !matchesQuery(doc, query));
			const success = await this._saveData(newData);
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

	/**
	 * Delete all documents from the collection.
	 * @returns {Promise<number>} A Promise that resolves to the number of documents deleted.
	 * @throws {lowstorageError} If the delete operation fails.
	 * @throws {S3OperationError} If the S3 operation fails.
	 */
	async deleteAll() {
		try {
			const data = await this._loadData();
			const initialLength = data.length;
			const success = await this._saveData([]);
			if (!success) {
				throw new S3OperationError(`${MODULE_NAME}: Failed to delete document`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
			}
			return initialLength;
		} catch (error) {
			if (error instanceof S3OperationError) {
				throw error;
			}
			throw new lowstorageError(`${MODULE_NAME}: Delete operation failed: ${error.message}`, lowstorage_ERROR_CODES.DELETE_ERROR);
		}
	}

	/**
	 * Count the number of documents in the collection.
	 * @param {Object} [query={}] - The query to filter documents.
	 * @returns {Promise<number>} A Promise that resolves to the number of documents in the collection.
	 * @throws {lowstorageError} If the count operation fails.
	 */
	async count(query = {}) {
		try {
			const data = await this.find(query);
			return data.length;
		} catch (error) {
			throw new lowstorageError(`${MODULE_NAME}: Count operation failed: ${error.message}`, lowstorage_ERROR_CODES.COUNT_ERROR);
		}
	}

	async renameCollection(newColName, newSchema = this._schema) {
		try {
			_hasColName(newColName);
			const exists = await this._s3.fileExists(`${this._dirPrefix}${DEFAULT_DELIMITER}${newColName}${COL_SUFFIX}`);
			if (!!exists) {
				throw new lowstorageError(`${MODULE_NAME}: Collection ${newColName} already exists`, lowstorage_ERROR_CODES.COLLECTION_EXISTS);
			}
			const schema = newSchema || this.getAvroSchema();
			const data = await this._loadData();
			const createNew = new Collection(newColName, schema, this._s3, this._dirPrefix, this._safeWrite, this._chunkSize);
			await createNew._saveData(data);
			await this._s3.delete(`${this._dirPrefix}${DEFAULT_DELIMITER}${this._colName}${COL_SUFFIX}`);
			return createNew;
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
}

// export default lowstorage;
export { lowstorage, lowstorageError, lowstorage_ERROR_CODES };
