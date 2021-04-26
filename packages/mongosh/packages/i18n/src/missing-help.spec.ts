import fs from 'fs';
import path from 'path';
import { signatures } from '../../shell-api/src/index';

const IGNORED_TYPES = [
  'unknown',
  'ExplainableCursor', // inherits cursor
  'CursorIterationResult', // internal / presentation only
  'DeprecatedClass' // internal
];

const IGNORED_ATTRIBUTES = [
  'Mongo.show', // documented as top level command
  'Mongo.use', // documented as top level command,
  'ChangeStreamCursor.map',
  'ChangeStreamCursor.forEach',
  'ChangeStreamCursor.toArray',
  'ChangeStreamCursor.objsLeftInBatch',
  'ChangeStreamCursor.pretty',
];

const localesDir = path.resolve(__dirname, 'locales');

// eslint-disable-next-line no-sync
const localeFiles = fs.readdirSync(localesDir)
  .filter((filename) => {
    return filename.match(/^[a-z]{2,3}_[A-Z]{2,3}\.ts$/);
  })
  .filter((filename) => { // skip german for now
    return filename.includes('en');
  });

const typeNames = Object.keys(signatures)
  .filter((typeName) => !IGNORED_TYPES.includes(typeName));

localeFiles.forEach((localeFile) => {
  const locale = require(path.join(localesDir, localeFile)).default;
  const localeName = localeFile.replace('.ts', '');

  describe(`${localeName}`, () => {
    typeNames.forEach((typeName) => {
      const typeHelp = locale['shell-api'].classes[typeName];

      it(`has translations for ${typeName} type`, () => {
        if (!typeHelp) {
          throw new Error(`Missing ${localeName} help for type: ${typeName}`);
        }
      });

      if (!typeHelp) {
        return;
      }

      const attributeNames = Object.keys(signatures[typeName].attributes as object)
        .filter((attributeName) => !IGNORED_ATTRIBUTES.includes(`${typeName}.${attributeName}`));

      attributeNames.forEach((attributeName) => {
        it(`has translations for ${typeName}.${attributeName} attribute`, () => {
          const attributeHelp = typeHelp.help.attributes && typeHelp.help.attributes[attributeName];
          if (
            !attributeHelp ||
                typeof attributeHelp !== 'object' ||
                !attributeHelp.description
          ) {
            throw new Error(`Missing en_US help for attribute: ${typeName}.${attributeName}`);
          }
        });
      });
    });
  });
});


