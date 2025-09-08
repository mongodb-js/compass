import type { MockDataSchemaResponse } from '@mongodb-js/compass-generative-ai';

const UNRECOGNIZED_FAKER_METHOD = 'Unrecognized';

/**
 * Validates each field in the provided faker schema by attempting to execute the specified faker method
 * with and without arguments. If the method execution fails, it marks it as 'Unrecognized'.
 *
 * @param {MockDataSchemaResponse} fakerSchema - The schema containing fields with faker methods and arguments.
 * @returns {Array} The array of fields with validation results, marking unrecognized methods as needed.
 */
export const validateFakerSchema = async (
  fakerSchema: MockDataSchemaResponse
) => {
  const { faker } = await import('@faker-js/faker');
  return fakerSchema.content.fields.map((field) => {
    const { fakerMethod, fakerArgs } = field;

    const [first, second] = fakerMethod.split('.');
    try {
      // Try with arguments first
      const fakerMethodWithArgs = eval(
        `(faker, ...fakerArgs) => faker["${first}"]["${second}"](...fakerArgs)`
      );
      fakerMethodWithArgs(faker, ...fakerArgs);
      return field;
    } catch (error) {
      console.error(error);
      // If that fails and there are arguments, try without arguments
      if (fakerArgs.length > 0) {
        try {
          const fakerMethodWithoutArgs = eval(
            `(faker) => faker["${first}"]["${second}"]()`
          );
          fakerMethodWithoutArgs(faker);
          return field;
        } catch (error) {
          console.error(error);
          return {
            ...field,
            fakerMethod: UNRECOGNIZED_FAKER_METHOD,
            fakerArgs: [],
          };
        }
      }
      return {
        ...field,
        fakerMethod: 'Unrecognized',
        fakerArgs: [],
      };
    }
  });
};
