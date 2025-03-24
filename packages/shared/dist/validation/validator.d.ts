import { JSONSchemaType } from 'ajv';
/**
 * Validates data against a JSON schema
 * @param schema JSON schema to validate against
 * @param data Data to validate
 * @returns Validation result with errors if any
 */
export declare function validate<T>(schema: JSONSchemaType<T>, data: unknown): {
    valid: boolean;
    data?: T;
    errors?: string[];
};
/**
 * Creates a validator function for a specific schema
 * @param schema JSON schema to create validator for
 * @returns Validation function
 */
export declare function createValidator<T>(schema: JSONSchemaType<T>): (data: unknown) => {
    valid: boolean;
    data?: T | undefined;
    errors?: string[];
};
