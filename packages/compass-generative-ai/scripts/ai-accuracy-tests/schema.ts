import type {
  SimplifiedSchema,
  SimplifiedSchemaArrayType,
  SimplifiedSchemaDocumentType,
  SimplifiedSchemaType,
} from 'mongodb-schema';

const PROPERTY_REGEX = '^[a-zA-Z_$][0-9a-zA-Z_$]*$';

export class SchemaFormatter {
  static getSchemaFromTypes(pInput: SimplifiedSchema): string {
    return new SchemaFormatter().format(pInput);
  }

  schemaString = '';

  format(pInitial: SimplifiedSchema): string {
    this.processDocumentType('', pInitial);
    return this.schemaString;
  }

  private processSchemaTypeList(
    prefix: string,
    pTypes: SimplifiedSchemaType[]
  ) {
    if (pTypes.length !== 0) {
      this.processSchemaType(prefix, pTypes[0]);
    }
  }

  private processSchemaType(prefix: string, pType: SimplifiedSchemaType) {
    const bsonType = pType.bsonType;
    if (bsonType === 'Document') {
      const fields = (pType as SimplifiedSchemaDocumentType).fields;

      if (Object.keys(fields).length === 0) {
        this.addToFormattedSchemaString(prefix + ': Document');
        return;
      }

      this.processDocumentType(prefix, fields);
      return;
    }

    if (bsonType === 'Array') {
      const types = (pType as SimplifiedSchemaArrayType).types;

      if (types.length === 0) {
        this.addToFormattedSchemaString(prefix + ': ' + 'Array');
        return;
      }

      const firstType = types[0].bsonType;
      if (firstType !== 'Array' && firstType !== 'Document') {
        this.addToFormattedSchemaString(
          prefix + ': ' + 'Array<' + firstType + '>'
        );
        return;
      }

      // Array of documents or arrays.
      // We only use the first type.
      this.processSchemaType(prefix + '[]', types[0]);
      return;
    }

    this.addToFormattedSchemaString(prefix + ': ' + bsonType);
  }

  private processDocumentType(prefix: string, pDoc: SimplifiedSchema) {
    if (!pDoc) {
      return;
    }

    Object.keys(pDoc).forEach((key) => {
      const keyAsString = this.getPropAsString(key);
      this.processSchemaTypeList(
        prefix + (prefix.length === 0 ? '' : '.') + keyAsString,
        pDoc[key]?.types
      );
    });
  }

  getPropAsString(pProp: string): string {
    if (pProp.match(PROPERTY_REGEX)) {
      return pProp;
    }

    try {
      return JSON.stringify(pProp);
    } catch (e) {
      return pProp;
    }
  }

  addToFormattedSchemaString(fieldAndType: string) {
    if (this.schemaString.length > 0) {
      this.schemaString += '\n';
    }
    this.schemaString += fieldAndType;
  }
}

// import { getSimplifiedSchema } from 'mongodb-schema';
// async function testSchema() {
//   console.log('test schema...');
//   const schema = await getSimplifiedSchema([{
//     name: 'test',
//     a: 33,
//     c: {
//       d: 55
//     },
//     eee: ['nice']
//   }]);
//   console.log('prompt test:', SchemaFormatter.getSchemaFromTypes(schema));
// }
// void testSchema();
