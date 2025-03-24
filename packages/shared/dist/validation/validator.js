"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
exports.createValidator = createValidator;
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
// Create and configure Ajv instance
const ajv = new ajv_1.default({ allErrors: true, removeAdditional: 'all' });
(0, ajv_formats_1.default)(ajv);
/**
 * Validates data against a JSON schema
 * @param schema JSON schema to validate against
 * @param data Data to validate
 * @returns Validation result with errors if any
 */
function validate(schema, data) {
    const validate = ajv.compile(schema);
    const valid = validate(data);
    if (valid) {
        return { valid: true, data: data };
    }
    else {
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
function createValidator(schema) {
    return (data) => validate(schema, data);
}
