declare const matchesQuery: (document: Record<string, any>, query: Record<string, any>) => boolean;
declare const generateUUID: () => Promise<string>;
declare const ensureIdFieldInSchema: (schema: Object) => Object;
export { matchesQuery, generateUUID, ensureIdFieldInSchema };
