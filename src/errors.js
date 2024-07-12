'use strict';

const lowstorage_ERROR_CODES = {
	MISSING_ARGUMENT: 'MISSING_ARGUMENT',
	COLLECTION_EXISTS: 'COLLECTION_EXISTS',
	CREATE_COLLECTION_ERROR: 'CREATE_COLLECTION_ERROR',
	RENAME_COLLECTION_ERROR: 'RENAME_COLLECTION_ERROR',
	REMOVE_COLLECTION_ERROR: 'REMOVE_COLLECTION_ERROR',
	UPDATE_COLLECTION_SCHEMA_ERROR: 'UPDATE_COLLECTION_SCHEMA_ERROR',
	COLLECTION_NOT_FOUND: 'COLLECTION_NOT_FOUND',
	SCHEMA_VALIDATION_ERROR: 'SCHEMA_VALIDATION_ERROR',
	DOCUMENT_VALIDATION_ERROR: 'DOCUMENT_VALIDATION_ERROR',
	S3_OPERATION_ERROR: 'S3_OPERATION_ERROR',
	FIND_ERROR: 'FIND_ERROR',
	FIND_ONE_ERROR: 'FIND_ONE_ERROR',
	SAVE_DATA_ERROR: 'SAVE_DATA_ERROR',
	INSERT_ERROR: 'INSERT_ERROR',
	UPDATE_ERROR: 'UPDATE_ERROR',
	UPDATE_ONE_ERROR: 'UPDATE_ONE_ERROR',
	DELETE_ERROR: 'DELETE_ERROR',
	COUNT_ERROR: 'COUNT_ERROR',
	UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};
class lowstorageError extends Error {
	constructor(message, code = lowstorage_ERROR_CODES.UNKNOWN_ERROR) {
		super(`lowstorageError: ${message} :: code: ${code}`);
		this.name = this.constructor.name;
		this.code = code;
		Error.captureStackTrace(this, this.constructor);
	}
}

class CollectionNotFoundError extends lowstorageError {
	constructor(collectionName) {
		super(`Collection ${collectionName} not found`, lowstorage_ERROR_CODES.COLLECTION_NOT_FOUND);
	}
}

class SchemaValidationError extends lowstorageError {
	constructor(message) {
		super(message, lowstorage_ERROR_CODES.SCHEMA_VALIDATION_ERROR);
	}
}

class DocumentValidationError extends lowstorageError {
	constructor(message) {
		super(message, lowstorage_ERROR_CODES.DOCUMENT_VALIDATION_ERROR);
	}
}

class S3OperationError extends lowstorageError {
	constructor(message, operation) {
		super(`S3 ${operation} operation failed: ${message}`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
	}
}

export {
	lowstorage_ERROR_CODES,
	lowstorageError,
	CollectionNotFoundError,
	SchemaValidationError,
	DocumentValidationError,
	S3OperationError,
};
