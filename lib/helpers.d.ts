declare const matchesQuery: (document: Record<string, any>, query: Record<string, any>) => boolean;
declare const generateUUID: () => Promise<string>;
declare const ensureIdFieldInSchema: (schema: Object) => Object;
declare const inferAvroSchema: (data: any[] | {
    [s: string]: unknown;
} | ArrayLike<unknown>, typeName?: string) => Object;
export { matchesQuery, generateUUID, inferAvroSchema, ensureIdFieldInSchema };
