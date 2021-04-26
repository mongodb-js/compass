import { signatures } from '../';
import enUs from '../../i18n/src/locales/en_US';

Object.keys(signatures)
  .sort()
  .filter((typeName) => typeName !== 'unknown')
  .filter((typeName) => !typeName.endsWith('Result'))
  .forEach((typeName) => {
    const typeHelp = enUs['shell-api'].classes[typeName];
    if (!typeHelp) {
      console.info('Missing en_US help for type:', typeName);
      return;
    }

    Object.keys(signatures[typeName].attributes)
      .sort()
      .forEach((attributeName) => {
        const attributeHelp = typeHelp.help.attributes[attributeName];

        if (!attributeHelp || typeof attributeHelp !== 'object' || !attributeHelp.description) {
          console.info('Missing en_US help for attribute:', `${typeName}.${attributeName}`);
        }
      });
  });
