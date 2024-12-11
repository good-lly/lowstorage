declare const lowstorage_ERROR_CODES: Record<string, string>;
export type errorCode = (typeof lowstorage_ERROR_CODES)[keyof typeof lowstorage_ERROR_CODES];
declare class lowstorageError extends Error {
    code: errorCode;
    constructor(message: string, code?: errorCode);
}
declare class CollectionNotFoundError extends lowstorageError {
    constructor(collectionName: any, code?: errorCode);
}
declare class DocumentValidationError extends lowstorageError {
    constructor(message: string, code?: errorCode);
}
declare class S3OperationError extends lowstorageError {
    constructor(message: string, operation: string);
}
export { lowstorage_ERROR_CODES, lowstorageError, CollectionNotFoundError, DocumentValidationError, S3OperationError };
