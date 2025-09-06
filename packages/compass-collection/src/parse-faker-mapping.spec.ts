import { expect } from 'chai';
import {
  parseFakerMappings,
  renderFakerCallTree,
} from './parse-faker-mappings';
import type { FakerCallTree } from './parse-faker-mappings';

describe('parseFakerMappings', () => {
  it('handles flat documents', () => {
    const flatSchema = {
      fields: [
        {
          fieldPath: 'exploit_name',
          mongoType: 'String',
          fakerMethod: 'hacker.noun',
          fakerArgs: [],
          isArray: false,
          probability: 1.0,
        },
        {
          fieldPath: 'atomic_number',
          mongoType: 'Number',
          fakerMethod: 'science.chemicalElement',
          fakerArgs: [{ json: '{"property": "atomicNumber"}' }],
          isArray: false,
          probability: 1.0,
        },
        {
          fieldPath: 'is_classified',
          mongoType: 'Boolean',
          fakerMethod: 'datatype.boolean',
          fakerArgs: [{ json: '{"probability": 0.3}' }],
          isArray: false,
          probability: 1.0,
        },
      ],
    };

    const result = parseFakerMappings(flatSchema);

    const expected: FakerCallTree = {
      exploit_name: 'faker.hacker.noun()',
      atomic_number:
        'faker.science.chemicalElement({"property":"atomicNumber"})',
      is_classified: 'faker.datatype.boolean({"probability":0.3})',
    };

    expect(result).to.deep.equal(expected);
  });

  it('handles nested documents (tree depth 2)', () => {
    const nestedSchema = {
      fields: [
        {
          fieldPath: 'album_title',
          mongoType: 'String',
          fakerMethod: 'music.songName',
          fakerArgs: [],
          isArray: false,
          probability: 1.0,
        },
        {
          fieldPath: 'release_year',
          mongoType: 'Number',
          fakerMethod: 'date.recent',
          fakerArgs: [{ json: '{"days": 3650, "refDate": "2024-01-01"}' }],
          isArray: false,
          probability: 1.0,
        },
        {
          fieldPath: 'artist.stage_name',
          mongoType: 'String',
          fakerMethod: 'person.firstName',
          fakerArgs: [],
          isArray: false,
          probability: 1.0,
        },
        {
          fieldPath: 'artist.genre',
          mongoType: 'String',
          fakerMethod: 'music.genre',
          fakerArgs: [],
          isArray: false,
          probability: 1.0,
        },
        {
          fieldPath: 'distributor.airline_code',
          mongoType: 'String',
          fakerMethod: 'airline.airline',
          fakerArgs: [{ json: '{"format": "iata"}' }],
          isArray: false,
          probability: 1.0,
        },
        {
          fieldPath: 'distributor.flight_number',
          mongoType: 'String',
          fakerMethod: 'airline.flightNumber',
          fakerArgs: [{ json: '{"addLeadingZeros": true}' }],
          isArray: false,
          probability: 1.0,
        },
      ],
    };

    const result = parseFakerMappings(nestedSchema);

    const expected: FakerCallTree = {
      album_title: 'faker.music.songName()',
      release_year: 'faker.date.recent({"days":3650,"refDate":"2024-01-01"})',
      artist: {
        stage_name: 'faker.person.firstName()',
        genre: 'faker.music.genre()',
      },
      distributor: {
        airline_code: 'faker.airline.airline({"format":"iata"})',
        flight_number: 'faker.airline.flightNumber({"addLeadingZeros":true})',
      },
    };

    expect(result).to.deep.equal(expected);
  });

  it('handles more nested objects (tree depth 4)', () => {
    const deepNestedSchema = {
      fields: [
        {
          fieldPath: 'mission.spacecraft.navigation.latitude',
          mongoType: 'Number',
          fakerMethod: 'location.latitude',
          fakerArgs: [{ json: '{"precision": 4}' }],
          isArray: false,
          probability: 1.0,
        },
        {
          fieldPath: 'mission.crew.commander.callsign',
          mongoType: 'String',
          fakerMethod: 'hacker.abbreviation',
          fakerArgs: [],
          isArray: false,
          probability: 1.0,
        },
        {
          fieldPath: 'laboratory.experiment.sample.element',
          mongoType: 'String',
          fakerMethod: 'science.chemicalElement',
          fakerArgs: [{ json: '{"property": "symbol"}' }],
          isArray: false,
          probability: 1.0,
        },
      ],
    };

    const result = parseFakerMappings(deepNestedSchema);

    const expected: FakerCallTree = {
      mission: {
        spacecraft: {
          navigation: {
            latitude: 'faker.location.latitude({"precision":4})',
          },
        },
        crew: {
          commander: {
            callsign: 'faker.hacker.abbreviation()',
          },
        },
      },
      laboratory: {
        experiment: {
          sample: {
            element: 'faker.science.chemicalElement({"property":"symbol"})',
          },
        },
      },
    };

    expect(result).to.deep.equal(expected);
  });

  it('handles nested array fields with heterogeneous arguments', () => {
    const optionsArg = { json: '{"min": 1, "max": 3}' };
    const primitiveArg = 1;

    const nycConcertSchema = {
      fields: [
        {
          fieldPath: 'nycEvent.genres[]',
          mongoType: 'String',
          fakerMethod: 'helpers.arrayElements',
          fakerArgs: [
            {
              json: '["Jazz", "Hip-Hop", "Electronic", "Indie Rock", "R&B", "Pop", "Alternative"]',
            },
            optionsArg,
          ],
          isArray: true,
          probability: 1.0,
        },
        {
          fieldPath: 'nycEvent.headliners[]',
          mongoType: 'String',
          fakerMethod: 'helpers.arrayElements',
          fakerArgs: [
            {
              json: '["The Midnight Echoes", "Luna Vista", "Brooklyn Steel", "Neon Dreams", "Velvet Underground Tribute", "Electric Avenue"]',
            },
            optionsArg,
          ],
          isArray: true,
          probability: 1.0,
        },
        {
          fieldPath: 'nycEvent.venues[]',
          mongoType: 'String',
          fakerMethod: 'helpers.arrayElements',
          fakerArgs: [
            {
              json: '["Madison Square Garden", "Brooklyn Bowl", "Terminal 5", "Webster Hall", "Music Hall of Williamsburg", "Bowery Ballroom"]',
            },
            primitiveArg,
          ],
          isArray: true,
          probability: 0.9,
        },
      ],
    };

    const result = parseFakerMappings(nycConcertSchema);

    const expected: FakerCallTree = {
      nycEvent: {
        genres:
          "faker.helpers.arrayElements(['Jazz', 'Hip-Hop', 'Electronic', 'Indie Rock', 'R&B', 'Pop', 'Alternative'], {\"min\":1,\"max\":3})",
        headliners:
          "faker.helpers.arrayElements(['The Midnight Echoes', 'Luna Vista', 'Brooklyn Steel', 'Neon Dreams', 'Velvet Underground Tribute', 'Electric Avenue'], {\"min\":1,\"max\":3})",
        venues:
          "faker.helpers.arrayElements(['Madison Square Garden', 'Brooklyn Bowl', 'Terminal 5', 'Webster Hall', 'Music Hall of Williamsburg', 'Bowery Ballroom'], 1)",
      },
    };

    expect(result).to.deep.equal(expected);
  });
});

/**
 * Note: The expected outputs in the suite should be runnable JS experessions,
 * assuming the environment has the faker.js module ready to execute against.
 */
describe('renderFakerCallTree', () => {
  it('renders flat faker call tree to formatted string', () => {
    const fakerCallTree: FakerCallTree = {
      exploit_name: 'faker.hacker.noun()',
      atomic_number:
        'faker.science.chemicalElement({"property":"atomicNumber"})',
      is_classified: 'faker.datatype.boolean({"probability":0.3})',
    };

    const result = renderFakerCallTree(fakerCallTree);

    const expected = `{
	'exploit_name': faker.hacker.noun(),
	'atomic_number': faker.science.chemicalElement({"property":"atomicNumber"}),
	'is_classified': faker.datatype.boolean({"probability":0.3})
}`;

    expect(result).to.equal(expected);
  });
});

describe('parseFakerMappings error handling', () => {
  it('throws error when array field does not end with []', () => {
    const invalidSchema = {
      fields: [
        {
          fieldPath: 'items',
          mongoType: 'String',
          fakerMethod: 'lorem.word',
          fakerArgs: [],
          isArray: true,
          probability: 1.0,
        },
      ],
    };

    expect(() => parseFakerMappings(invalidSchema)).to.throw(
      'expected the array-type field to end with []'
    );
  });

  it('throws error when fieldPath has empty part before []', () => {
    const invalidSchema = {
      fields: [
        {
          fieldPath: 'items.[]',
          mongoType: 'String',
          fakerMethod: 'lorem.word',
          fakerArgs: [],
          isArray: true,
          probability: 1.0,
        },
      ],
    };

    expect(() => parseFakerMappings(invalidSchema)).to.throw(
      'expected fieldPath to be non-empty part before "[]"'
    );
  });

  it('throws error when fieldPath is completely empty', () => {
    const invalidSchema = {
      fields: [
        {
          fieldPath: '',
          mongoType: 'String',
          fakerMethod: 'lorem.word',
          fakerArgs: [],
          isArray: false,
          probability: 1.0,
        },
      ],
    };

    expect(() => parseFakerMappings(invalidSchema)).to.throw(
      'expected part in `fieldPath` to be non-empty'
    );
  });

  it('throws error when fieldPath part is empty', () => {
    const invalidSchema = {
      fields: [
        {
          fieldPath: 'user..name',
          mongoType: 'String',
          fakerMethod: 'person.firstName',
          fakerArgs: [],
          isArray: false,
          probability: 1.0,
        },
      ],
    };

    expect(() => parseFakerMappings(invalidSchema)).to.throw(
      'expected part in `fieldPath` to be non-empty'
    );
  });

  it('throws error when fieldPath contains null character', () => {
    const invalidSchema = {
      fields: [
        {
          fieldPath: 'user\0name',
          mongoType: 'String',
          fakerMethod: 'person.firstName',
          fakerArgs: [],
          isArray: false,
          probability: 1.0,
        },
      ],
    };

    expect(() => parseFakerMappings(invalidSchema)).to.throw(
      'fieldPath part contains null character, which is not allowed in MongoDB field names'
    );
  });

  it('throws error when fieldPath starts with $', () => {
    const invalidSchema = {
      fields: [
        {
          fieldPath: '$reserved',
          mongoType: 'String',
          fakerMethod: 'lorem.word',
          fakerArgs: [],
          isArray: false,
          probability: 1.0,
        },
      ],
    };

    expect(() => parseFakerMappings(invalidSchema)).to.throw(
      "fieldPath part starts with '$', which is not allowed in MongoDB field names"
    );
  });

  it('throws error when [] appears in middle of field part', () => {
    const invalidSchema = {
      fields: [
        {
          fieldPath: 'items[]extra.name',
          mongoType: 'String',
          fakerMethod: 'lorem.word',
          fakerArgs: [],
          isArray: false,
          probability: 1.0,
        },
      ],
    };

    expect(() => parseFakerMappings(invalidSchema)).to.throw(
      'Invalid fieldPath "items[]extra.name": "[]" can only appear at the very end of the `fieldPath`'
    );
  });
});
