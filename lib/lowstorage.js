'use strict';
// type CollectionOptions = {
// 	skip?: number;
// 	limit?: number;
// };
// type UpdateOptions = {
// 	upsert?: boolean;
// };
import { S3 } from 'ultralight-s3';
import { Packr } from 'msgpackr/index-no-eval';
import { lowstorage_ERROR_CODES, lowstorageError, DocumentValidationError, S3OperationError } from 'errors';
const MOD_NAME = 'lowstorage';
const DELIMITER = '/';
const DIR_PREFIX = 'lowstorage';
const COL_SUFFIX = '.mpck';
const CHUNK_5MB = 5 * 1024 * 1024;
const EMPTY_DATA = '';
const generateUUID = async () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    const nodeCrypto = await import('node:crypto');
    if (typeof nodeCrypto.randomUUID !== 'undefined' && typeof nodeCrypto.randomUUID === 'function') {
        return nodeCrypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        var r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
const matchesQuery = (document, query) => {
    return Object.keys(query).every((key) => document[key] === query[key]);
};
const _hasColName = (colName = '') => {
    if (colName.trim() === '' || colName === null || typeof colName === 'undefined' || colName.length > 255) {
        throw new lowstorageError(`Collection name is required, null or too long`, lowstorage_ERROR_CODES.MISSING_ARGUMENT);
    }
};
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
     * @param {string} [options.dirPrefix=DIR_PREFIX] - Directory prefix for collections.
     * @param {Number} [options.maxRequestSizeInBytes=CHUNK_5MB] - Chunk size for reading and writing data. AWS S3 has a minimum of 5MB per object.
     * @returns {lowstorage} A new lowstorage instance.
     */
    _s3;
    _dirPrefix;
    constructor(options) {
        this._checkArgs(options);
        this._s3 = new S3(options);
        this._dirPrefix = options.dirPrefix || DIR_PREFIX;
    }
    _checkArgs = (args) => {
        const requiredFields = ['accessKeyId', 'secretAccessKey', 'endpoint', 'bucketName'];
        for (const field of requiredFields) {
            if (!args[field]) {
                throw new lowstorageError(`${field} is required`, lowstorage_ERROR_CODES.MISSING_ARGUMENT);
            }
        }
    };
    /**
     * Check if a bucket exists.
     * @returns {Promise<boolean>} True if the bucket exists, false otherwise.
     * @throws {lowstorageError} If there's an error.
     */
    async checkIfStorageExists() {
        try {
            const exists = await this._s3.bucketExists();
            return !!exists;
        }
        catch (error) {
            if (error.message.includes('Not Found')) {
                return false;
            }
            throw new lowstorageError(`${error.message}`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
        }
    }
    /**
     * Create a new storage bucket if it doesn't exist.
     * @returns {Promise<boolean>} A Promise that resolves to true if the bucket was created or already exists, false otherwise.
     * @throws {lowstorageError} If there's an error.
     */
    async createStorage() {
        try {
            const exists = await this.checkIfStorageExists();
            if (!exists) {
                const createdBucket = await this._s3.createBucket();
                return !!createdBucket;
            }
            return exists;
        }
        catch (error) {
            if (error instanceof lowstorageError) {
                throw error;
            }
            throw new lowstorageError(`${error.message}`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
        }
    }
    // TODO: fix if list has more than 1000 items
    /**
     * List all collections.
     * @returns {Promise<string[]>} An array of collection names.
     * @throws {S3OperationError} If there's an error during S3 operation.
     * @throws {lowstorageError} If there's an error.
     */
    async listCollections() {
        try {
            const listed = await this._s3.list(DELIMITER, this._dirPrefix);
            if (Array.isArray(listed)) {
                // filter only the collection name, not the full path and remove files without COL_SUFFIX
                const filtered = listed.filter((entry) => entry.key.endsWith(COL_SUFFIX));
                return filtered.map((entry) => entry.key.slice(this._dirPrefix.length + 1, -COL_SUFFIX.length));
            }
            else if (typeof listed === 'object' && listed !== null && 'keyCount' in listed && listed.keyCount === '0') {
                return [];
            }
            return [];
        }
        catch (error) {
            if (error instanceof S3OperationError) {
                throw error;
            }
            throw new lowstorageError(`${error.message}`, lowstorage_ERROR_CODES.LIST_COLLECTIONS_ERROR);
        }
    }
    /**
     * Check if a collection exists.
     * @param {string} colName - The name of the collection.
     * @returns {Promise<boolean>} True if the collection exists, false otherwise.
     * @throws {lowstorageError} If there's an error.
     */
    async collectionExists(colName = '') {
        try {
            _hasColName(colName);
            const exists = await this._s3.fileExists(`${this._dirPrefix}${DELIMITER}${colName}${COL_SUFFIX}`);
            return !!exists;
        }
        catch (error) {
            if (error.message.includes('Not Found')) {
                return false;
            }
            throw new lowstorageError(`${error.message}`, lowstorage_ERROR_CODES.COLLECTION_NOT_FOUND);
        }
    }
    /**
     * Create a new collection.
     * @param {string} colName - The name of the collection.
     * @param {Array} [data=[]] - The initial data for the collection.
     * @returns {Promise<Collection>} A Promise that resolves to a Collection object.
     * @throws {lowstorageError} If there's an error.
     */
    async createCollection(colName = '', data = []) {
        try {
            _hasColName(colName);
            const exists = await this.collectionExists(colName);
            if (!exists) {
                if (data.length > 0) {
                    const packr = new Packr();
                    await this._s3.put(`${this._dirPrefix}${DELIMITER}${colName}${COL_SUFFIX}`, packr.pack(data));
                }
                else {
                    await this._s3.put(`${this._dirPrefix}${DELIMITER}${colName}${COL_SUFFIX}`, EMPTY_DATA);
                }
                return this.collection(colName);
            }
            throw new lowstorageError(`Collection ${colName} already exists`, lowstorage_ERROR_CODES.COLLECTION_EXISTS);
        }
        catch (error) {
            throw new lowstorageError(`${error.message}`, lowstorage_ERROR_CODES.CREATE_COLLECTION_ERROR);
        }
    }
    /**
     * Remove a collection.
     * @param {string} colName - The name of the collection.
     * @returns {Promise<boolean>} A Promise that resolves to true if the collection is removed, false otherwise.
     * @throws {lowstorageError} If there's an error.
     */
    async removeCollection(colName = '') {
        try {
            _hasColName(colName);
            const deleted = await this._s3.delete(`${this._dirPrefix}${DELIMITER}${colName}${COL_SUFFIX}`);
            const exists = await this.collectionExists(colName);
            if (!deleted || exists) {
                return false;
            }
            if (deleted && !exists) {
                return true;
            }
            if (typeof exists !== 'boolean') {
                throw new lowstorageError(`Failed to delete collection ${colName}`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
            }
            throw new lowstorageError(`Collection ${colName} does not exist`, lowstorage_ERROR_CODES.REMOVE_COLLECTION_ERROR);
        }
        catch (error) {
            if (error instanceof S3OperationError) {
                throw error;
            }
            throw new lowstorageError(`Failed to remove collection: ${error.message}`, lowstorage_ERROR_CODES.REMOVE_COLLECTION_ERROR);
        }
    }
    /**
     * Get or create a collection.
     * @param {string} colName - The name of the collection.
     * @param {boolean} [autoCreate=true] - Whether to automatically create the collection if it doesn't exist.
     * @returns {Promise<Collection>} A Promise that resolves to a Collection object.
     * @throws {lowstorageError} If there's an error.
     */
    async collection(colName = '', autoCreate = true) {
        try {
            _hasColName(colName);
            const colPath = `${this._dirPrefix}${DELIMITER}${colName}${COL_SUFFIX}`;
            const exists = await this._s3.fileExists(colPath);
            if (!exists) {
                if (!autoCreate) {
                    throw new lowstorageError(`Collection ${colName} does not exist`, lowstorage_ERROR_CODES.COLLECTION_NOT_FOUND);
                }
                // TODO: check if this is the right way to handle empty data
                await this._s3.put(colPath, EMPTY_DATA);
            }
            return new Collection(colName, this._s3, this._dirPrefix);
        }
        catch (error) {
            throw new lowstorageError(`${error.message}`, lowstorage_ERROR_CODES.COLLECTION_NOT_FOUND);
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
 * @class Collection
 * @example const storage = new lowstorage({
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
 */
class Collection {
    /**
     * Create a new Collection instance.
     * @param {string} colName - The name of the collection.
     * @param {S3} s3 - The S3 instance.
     * @param {string} [dirPrefix=DIR_PREFIX] - The directory prefix for the collection.
     * @param {boolean} [safeWrite=false] - Whether to perform a safe write operation. It doublechecks the ETag of the object before writing. False = overwrites the object, True = only writes if the object has not been modified.
     * @param {Number} [chunkSize=CHUNK_5MB] - The chunk size for reading and writing data. AWS S3 has a maximum of 5MB per object.
     * @returns {Collection} A new Collection instance.
     */
    _colName;
    _s3;
    _dirPrefix;
    _chunkSize;
    _lastETag;
    _dataCache;
    _key;
    _packr;
    constructor(colName = '', s3, dirPrefix = DIR_PREFIX, chunkSize = CHUNK_5MB) {
        this._colName = colName.trim();
        this._s3 = s3;
        this._dirPrefix = dirPrefix;
        this._chunkSize = chunkSize || CHUNK_5MB;
        this._lastETag = '';
        this._s3.setMaxRequestSizeInBytes(this._chunkSize);
        this._dataCache = [];
        this._key = `${this._dirPrefix}${DELIMITER}${this._colName}${COL_SUFFIX}`;
        this._packr = new Packr();
    }
    getProps = () => ({
        colName: this._colName,
        s3: this._s3,
        dirPrefix: this._dirPrefix,
        chunkSize: this._chunkSize,
    });
    setProps = (props) => {
        this._colName = props.colName;
        this._s3 = props.s3;
        this._dirPrefix = props.dirPrefix;
        this._chunkSize = props.chunkSize;
    };
    getCollectionETag = () => {
        return this._lastETag;
    };
    async _isSameFile(key) {
        const resp = await this._s3.fileExists(this._key, { 'if-match': this._lastETag });
        if (resp === null || !resp) {
            return false;
        }
        return true;
    }
    async _loadData() {
        try {
            const response = await this._s3.get(this._key, { 'if-none-match': this._lastETag });
            if (response === null) {
                return this._dataCache;
            }
            const data = await response.arrayBuffer();
            const etag = this._s3.sanitizeETag(response.headers.get('etag') || response.headers.get('ETag') || '');
            this._lastETag = etag === null || etag.length === 0 ? this._lastETag : etag;
            if (data.byteLength < this._chunkSize) {
                this._dataCache = data.byteLength > 0 ? this._packr.unpack(data) : [];
                return this._dataCache;
            }
            let offset = this._chunkSize;
            let bufferArr = [Buffer.from(data)];
            let repeat = true;
            while (repeat) {
                const nextDataResponse = await this._s3.getResponse(this._key, false, offset, offset + this._chunkSize);
                const nextDataBody = await nextDataResponse.arrayBuffer();
                bufferArr.push(Buffer.from(nextDataBody));
                offset += this._chunkSize;
                const contentLength = parseInt(nextDataResponse.headers.get('content-length') || nextDataBody.byteLength.toString());
                if (contentLength < this._chunkSize) {
                    repeat = false;
                }
            }
            this._dataCache = this._packr.unpack(Buffer.concat(bufferArr));
            return this._dataCache;
        }
        catch (error) {
            if (error.toString().indexOf('status 404: Unknown - Not Found') > -1) {
                this._dataCache = [];
                return this._dataCache;
            }
            throw new S3OperationError(`${MOD_NAME}: Failed to load data: ${error.message}`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
        }
    }
    async _saveData(data) {
        try {
            const dataBuffer = data.length > 0 ? this._packr.pack(data) : EMPTY_DATA; // TODO: check if this is the right way to handle empty data
            const resp = await this._s3.put(this._key, dataBuffer);
            if (typeof resp === 'object' && 'status' in resp && resp.status !== 200) {
                throw new S3OperationError(`${MOD_NAME}: Failed to save data`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
            }
            // Update the cached ETag
            const newETag = resp.headers?.get('etag') || '';
            if (newETag && newETag.length > 0) {
                this._lastETag = this._s3.sanitizeETag(newETag);
                this._dataCache = data;
            }
            return true;
        }
        catch (error) {
            if (error instanceof S3OperationError || error instanceof lowstorageError) {
                throw error;
            }
            throw new lowstorageError(`${error.message}`, lowstorage_ERROR_CODES.SAVE_DATA_ERROR);
        }
    }
    /**
     * Insert a document into the collection.
     * @param {Object|Array} doc - The document to insert.
     * @returns {Promise<Array>} A Promise that resolves to the array of inserted document(s).
     * @throws {lowstorageError} If there's an error.
     */
    async insert(doc) {
        try {
            if (doc === undefined || doc === null) {
                throw new lowstorageError(`Document is required for insert`, lowstorage_ERROR_CODES.INSERT_ERROR);
            }
            if (typeof doc !== 'object' && !Array.isArray(doc)) {
                throw new DocumentValidationError(`${MOD_NAME}: Document must be an object or an array`, lowstorage_ERROR_CODES.DOCUMENT_VALIDATION_ERROR);
            }
            const items = !Array.isArray(doc) ? [doc] : doc;
            const data = await this._loadData();
            for (let item of items) {
                if (typeof item !== 'object' || item === null) {
                    throw new DocumentValidationError(`${MOD_NAME}: Invalid input: input must be an object or an array of objects`, lowstorage_ERROR_CODES.DOCUMENT_VALIDATION_ERROR);
                }
                item._id = item._id || (await generateUUID());
                data.push(item);
            }
            const success = await this._saveData(data);
            if (!success) {
                throw new S3OperationError(`${MOD_NAME}: Failed to insert document`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
            }
            return items;
        }
        catch (error) {
            throw new lowstorageError(`Insert operation failed: ${error.message}`, lowstorage_ERROR_CODES.INSERT_ERROR);
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
                throw new lowstorageError(`Query is required for update`, lowstorage_ERROR_CODES.MISSING_ARGUMENT);
            }
            const data = await this._loadData();
            const start = options.skip !== undefined ? parseInt(String(options.skip), 10) : 0;
            const end = options.limit !== undefined
                ? start + parseInt(String(options.limit), 10)
                : undefined;
            const filteredData = data.filter((doc) => matchesQuery(doc, query)).slice(start, end);
            return filteredData;
        }
        catch (error) {
            throw new lowstorageError(`Find operation failed: ${error.message}`, lowstorage_ERROR_CODES.FIND_ERROR);
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
                throw new lowstorageError(`${MOD_NAME}: Query cannot be null`, lowstorage_ERROR_CODES.INVALID_ARGUMENT);
            }
            const result = await this.find(query, { limit: 1 });
            return result[0] || null;
        }
        catch (error) {
            if (error instanceof lowstorageError) {
                throw error;
            }
            throw new lowstorageError(`${MOD_NAME}: FindOne operation failed: ${error.message}`, lowstorage_ERROR_CODES.FIND_ONE_ERROR);
        }
    }
    /**
     * Update a single document in the collection that matches the query.
     * @param {Object} [query={}] - The query to filter the document to update.
     * @param {Object} [update={}] - The update operations to apply to the matching document.
     * @returns {Promise<number>} A Promise that resolves to number of documents updated.
     * @throws {lowstorageError} If the updateOne operation fails.
     * @throws {DocumentValidationError} If the updated document is invalid.
     * @throws {S3OperationError} If the S3 operation fails.
     */
    async update(query = {}, update = {}, options = {}) {
        try {
            if (query === undefined || query === null || update === undefined || update === null) {
                throw new lowstorageError(`Query and update values are required for update`, lowstorage_ERROR_CODES.MISSING_ARGUMENT);
            }
            const data = await this._loadData();
            if (data.length === 0)
                return 0;
            let updatedCount = 0;
            for (let i = 0; i < data.length; i++) {
                if (matchesQuery(data[i], query)) {
                    const updatedDoc = { ...data[i], ...update };
                    data[i] = updatedDoc;
                    updatedCount++;
                }
            }
            if (updatedCount > 0) {
                const success = await this._saveData(data);
                if (!success) {
                    throw new S3OperationError(`${MOD_NAME}: Failed to update document`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
                }
            }
            else if (options && 'upsert' in options && options.upsert) {
                // If upsert is true, we need to insert the document
                const success = await this.insert(update);
                if (!success) {
                    throw new S3OperationError(`${MOD_NAME}: Failed to update document`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
                }
                updatedCount = 1;
            }
            return updatedCount;
        }
        catch (error) {
            if (error instanceof S3OperationError) {
                throw error;
            }
            throw new lowstorageError(`Update operation failed: ${error.message}`, lowstorage_ERROR_CODES.UPDATE_ERROR);
        }
    }
    /**
     * Update a single document in the collection that matches the query.
     * @param {Object} [query={}] - The query to filter the document to update.
     * @param {Object} [update={}] - The update operations to apply to the matching document.
     * @returns {Promise<number>} A Promise that resolves to 1 if a document was updated, 0 otherwise.
     /**
     * Update a single document in the collection that matches the query.
     * @throws {lowstorageError} If the updateOne operation fails.
     * @throws {DocumentValidationError} If the updated document is invalid.
     * @throws {S3OperationError} If the S3 operation fails.
     */
    async updateOne(query = {}, update = {}, options = {}) {
        try {
            if (query === undefined || query === null || update === undefined || update === null) {
                throw new lowstorageError(`Query is required`, lowstorage_ERROR_CODES.MISSING_ARGUMENT);
            }
            const data = await this._loadData();
            if (data.length === 0)
                return 0;
            const docIndex = data.findIndex((doc) => matchesQuery(doc, query));
            if (docIndex !== -1) {
                const updatedDoc = { ...data[docIndex], ...update };
                data[docIndex] = updatedDoc;
                const success = await this._saveData(data);
                if (!success) {
                    throw new S3OperationError(`${MOD_NAME}: Failed to update document`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
                }
                return 1;
            }
            if (options && 'upsert' in options && options.upsert) {
                // If upsert is true, we need to insert the document
                const success = await this.insert(update);
                if (!success) {
                    throw new S3OperationError(`${MOD_NAME}: Failed to update document`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
                }
                return 1;
            }
            return 0;
        }
        catch (error) {
            throw new lowstorageError(`UpdateOne operation failed: ${error.message}`, lowstorage_ERROR_CODES.UPDATE_ONE_ERROR);
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
                throw new lowstorageError(`Query is required`, lowstorage_ERROR_CODES.MISSING_ARGUMENT);
            }
            const data = await this._loadData();
            if (data.length === 0)
                return 0;
            const initialLength = data.length;
            const newData = data.filter((doc) => !matchesQuery(doc, query));
            const success = await this._saveData(newData);
            if (!success) {
                throw new S3OperationError(`${MOD_NAME}: Failed to delete document`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
            }
            return initialLength - newData.length;
        }
        catch (error) {
            if (error instanceof S3OperationError) {
                throw error;
            }
            throw new lowstorageError(`Delete operation failed: ${error.message}`, lowstorage_ERROR_CODES.DELETE_ERROR);
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
                throw new S3OperationError(`${MOD_NAME}: Failed to delete document`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
            }
            return initialLength;
        }
        catch (error) {
            if (error instanceof S3OperationError) {
                throw error;
            }
            throw new lowstorageError(`Delete operation failed: ${error.message}`, lowstorage_ERROR_CODES.DELETE_ERROR);
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
        }
        catch (error) {
            throw new lowstorageError(`Count operation failed: ${error.message}`, lowstorage_ERROR_CODES.COUNT_ERROR);
        }
    }
    async renameCollection(newColName) {
        try {
            _hasColName(newColName);
            const exists = await this._s3.fileExists(`${this._dirPrefix}${DELIMITER}${newColName}${COL_SUFFIX}`);
            if (!!exists) {
                throw new lowstorageError(`${MOD_NAME}: Collection ${newColName} already exists`, lowstorage_ERROR_CODES.COLLECTION_EXISTS);
            }
            const data = await this._loadData();
            const createNew = new Collection(newColName, this._s3, this._dirPrefix, this._chunkSize);
            await createNew._saveData(data);
            await this._s3.delete(`${this._dirPrefix}${DELIMITER}${this._colName}${COL_SUFFIX}`);
            return createNew;
        }
        catch (error) {
            if (error instanceof lowstorageError) {
                throw error;
            }
            throw new lowstorageError(`Rename collection failed: ${error.message}`, lowstorage_ERROR_CODES.RENAME_COLLECTION_ERROR);
        }
    }
}
// export default lowstorage;
export { lowstorage, lowstorageError, lowstorage_ERROR_CODES };
//# sourceMappingURL=lowstorage.js.map