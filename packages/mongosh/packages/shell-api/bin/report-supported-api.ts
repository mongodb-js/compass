import { signatures } from '../';

Object.keys(signatures)
  .sort()
  .filter((typeName) => typeName !== 'unknown')
  .filter((typeName) => !typeName.endsWith('Result'))
  .forEach((typeName) => {
    console.info(`${typeName}:`);
    Object.keys(signatures[typeName].attributes)
      .sort()
      .forEach((attributeName) => {
        console.info(`  - ${attributeName}`);
      });
  });
