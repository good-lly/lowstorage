'use strict';

const lowstorage_ERROR_CODES: Record<string, string> = {
	MISSING_ARGUMENT: 'MISSING_ARGUMENT' as const,
	COLLECTION_EXISTS: 'COLLECTION_EXISTS' as const,
	CREATE_COLLECTION_ERROR: 'CREATE_COLLECTION_ERROR' as const,
	LIST_COLLECTIONS_ERROR: 'LIST_COLLECTIONS_ERROR' as const,
	RENAME_COLLECTION_ERROR: 'RENAME_COLLECTION_ERROR' as const,
	REMOVE_COLLECTION_ERROR: 'REMOVE_COLLECTION_ERROR' as const,
	COLLECTION_NOT_FOUND: 'COLLECTION_NOT_FOUND' as const,
	DOCUMENT_VALIDATION_ERROR: 'DOCUMENT_VALIDATION_ERROR' as const,
	S3_OPERATION_ERROR: 'S3_OPERATION_ERROR' as const,
	FIND_ERROR: 'FIND_ERROR' as const,
	FIND_ONE_ERROR: 'FIND_ONE_ERROR' as const,
	SAVE_DATA_ERROR: 'SAVE_DATA_ERROR' as const,
	INSERT_ERROR: 'INSERT_ERROR' as const,
	UPDATE_ERROR: 'UPDATE_ERROR' as const,
	UPDATE_ONE_ERROR: 'UPDATE_ONE_ERROR' as const,
	DELETE_ERROR: 'DELETE_ERROR' as const,
	COUNT_ERROR: 'COUNT_ERROR' as const,
	UNKNOWN_ERROR: 'UNKNOWN_ERROR' as const,
};

export type errorCode = (typeof lowstorage_ERROR_CODES)[keyof typeof lowstorage_ERROR_CODES];

class lowstorageError extends Error {
	code: errorCode;
	constructor(message: string, code: errorCode = lowstorage_ERROR_CODES.UNKNOWN_ERROR) {
		super(`lowstorageError: ${message} :: code: ${code}`);
		this.name = this.constructor.name;
		this.code = code;
		Error.captureStackTrace(this, this.constructor);
	}
}

class CollectionNotFoundError extends lowstorageError {
	constructor(collectionName: any, code: errorCode = lowstorage_ERROR_CODES.COLLECTION_NOT_FOUND) {
		super(`Collection ${collectionName} not found`, lowstorage_ERROR_CODES.COLLECTION_NOT_FOUND);
	}
}

class DocumentValidationError extends lowstorageError {
	constructor(message: string, code: errorCode = lowstorage_ERROR_CODES.DOCUMENT_VALIDATION_ERROR) {
		super(message, lowstorage_ERROR_CODES.DOCUMENT_VALIDATION_ERROR);
	}
}

class S3OperationError extends lowstorageError {
	constructor(message: string, operation: string) {
		super(`S3 ${operation} operation failed: ${message}`, lowstorage_ERROR_CODES.S3_OPERATION_ERROR);
	}
}

export { lowstorage_ERROR_CODES, lowstorageError, CollectionNotFoundError, DocumentValidationError, S3OperationError };
