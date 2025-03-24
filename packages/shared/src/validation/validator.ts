import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';

// Create and configure Ajv instance
const ajv = new Ajv({ allErrors: true, removeAdditional: 'all' });
addFormats(ajv);

/**
 * Validates data against a JSON schema
 * @param schema JSON schema to validate against
 * @param data Data to validate
 * @returns Validation result with errors if any
 */
export function validate<T>(schema: JSONSchemaType<T>, data: unknown): { 
  valid: boolean; 
  data?: T; 
  errors?: string[] 
} {
  const validate = ajv.compile(schema);
  const valid = validate(data);
  
  if (valid) {
    return { valid: true, data: data as T };
  } else {
    return {
      valid: false,
      errors: validate.errors?.map(err => {
        const property = err.instancePath ? err.instancePath.replace(/^\//, '') : err.params.missingProperty;
        return `${property}: ${err.message}`;
      })
    };
  }
}

/**
 * Creates a validator function for a specific schema
 * @param schema JSON schema to create validator for
 * @returns Validation function
 */
export function createValidator<T>(schema: JSONSchemaType<T>) {
  return (data: unknown) => validate<T>(schema, data);
}