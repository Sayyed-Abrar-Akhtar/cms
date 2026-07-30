import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

/**
 * Validates any data object against a provided draft-2020-12 / standard JSON Schema.
 * Returns null if valid, or a friendly error message/list if invalid.
 */
export function validateAgainstSchema(schema: Record<string, any>, data: any) {
  try {
    // Compile and validate the data against the schema
    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (!valid) {
      const errors = validate.errors || [];
      const fieldErrors: Record<string, string> = {};

      errors.forEach((err) => {
        const path = err.instancePath ? err.instancePath.replace(/^\//, "").replace(/\//g, ".") : "root";
        fieldErrors[path] = err.message || "Validation failed";
      });

      return fieldErrors;
    }
    return null;
  } catch (err: any) {
    return { schema: `Schema compilation/evaluation error: ${err.message}` };
  }
}

/**
 * Validates whether the given schema is itself a valid JSON Schema.
 */
export function isValidJSONSchema(schema: Record<string, any>): boolean {
  try {
    ajv.validateSchema(schema);
    return true;
  } catch (e) {
    return false;
  }
}
