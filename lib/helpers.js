'use strict';
import { randomUUID } from 'node:crypto';
const matchesQuery = (document, query) => {
    return Object.keys(query).every((key) => document[key] === query[key]);
};
const generateUUID = async () => {
    if (typeof randomUUID !== 'undefined' && typeof randomUUID === 'function') {
        return randomUUID();
    }
    if (typeof crypto !== 'undefined' && typeof crypto === 'object' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
const ensureIdFieldInSchema = (schema) => {
    const idField = {
        name: '_id',
        type: 'string',
        size: 16,
        logicalType: 'UUID',
    };
    if (typeof schema === 'undefined' || schema === null) {
        return schema;
    }
    if ('type' in schema && schema.type === 'record' && 'fields' in schema && Array.isArray(schema.fields)) {
        const hasIdField = schema.fields.some((field) => field.name === '_id');
        if (!hasIdField) {
            schema.fields.unshift(idField);
        }
    }
    else if ('type' in schema &&
        schema.type === 'array' &&
        'items' in schema &&
        schema.items !== null &&
        typeof schema.items === 'object' &&
        'type' in schema.items &&
        schema.items.type === 'record' &&
        'fields' in schema.items &&
        Array.isArray(schema.items.fields)) {
        const hasIdField = schema.items.fields.some((field) => field.name === '_id');
        if (!hasIdField) {
            schema.items.fields.unshift(idField);
        }
    }
    return schema;
};
export { matchesQuery, generateUUID, ensureIdFieldInSchema };
//# sourceMappingURL=helpers.js.map