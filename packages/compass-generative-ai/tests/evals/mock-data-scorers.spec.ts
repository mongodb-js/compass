import { expect } from 'chai';

import {
  FakerFieldNameAccuracy,
  FakerMethodSuggestionAccuracy,
  PercentRecognizedScorer,
  FakerArgParseableScorer,
  MethodRunnableScorer,
  FakerSampleValueAccuracy,
} from './mock-data-scorers';
import {
  DatelikeMethodCriterion,
  IdlikeMethodCriterion,
  NumericFieldMethodCriterion,
  TokenStringMethodCriterion,
  GenericStringMethodCriterion,
  LoremTextMethodCriterion,
  ShortPhraseStringCriterion,
  SecondaryAddressCriterion,
  GeoCoordinateMethodCriterion,
  isEvalCriterion,
} from './types';
import type {
  MockDataGeneratorEvalInput,
  MockDataGeneratorEvalOutput,
  MockDataGeneratorExpected,
} from './types';

function makeArgs(
  overrides: {
    providedSchema?: MockDataGeneratorEvalInput['providedSchema'];
    outputFields?: MockDataGeneratorEvalOutput['response']['fields'];
    expectedFields?: MockDataGeneratorExpected['response']['fields'];
    errorType?: 'UNEXPECTED_EVAL_ERROR';
  } = {}
) {
  return {
    input: {
      providedSchema: overrides.providedSchema ?? {
        name: { type: 'String', probability: 1 },
        age: { type: 'Number', probability: 1 },
      },
    },
    output: {
      response: {
        ...(overrides.errorType ? { errorType: overrides.errorType } : {}),
        fields: overrides.outputFields ?? [
          { fieldPath: 'name', fakerMethod: 'person.fullName', fakerArgs: [] },
          { fieldPath: 'age', fakerMethod: 'number.int', fakerArgs: [] },
        ],
      },
    },
    expected: {
      response: {
        fields: overrides.expectedFields ?? [
          { fieldPath: 'name', fakerMethod: 'person.fullName', fakerArgs: [] },
          { fieldPath: 'age', fakerMethod: 'number.int', fakerArgs: [] },
        ],
      },
    },
  };
}

describe('EvalCriterion', function () {
  it('every criterion rejects non-string input', function () {
    const allCriteria = [
      DatelikeMethodCriterion,
      IdlikeMethodCriterion,
      NumericFieldMethodCriterion,
      TokenStringMethodCriterion,
      GenericStringMethodCriterion,
      LoremTextMethodCriterion,
      ShortPhraseStringCriterion,
      SecondaryAddressCriterion,
      GeoCoordinateMethodCriterion,
    ];
    for (const c of allCriteria) {
      expect(c.satisfiedBy(42), `${c.name} should reject numbers`).to.be.false;
      expect(c.satisfiedBy(null), `${c.name} should reject null`).to.be.false;
      expect(c.satisfiedBy(undefined), `${c.name} should reject undefined`).to
        .be.false;
    }
  });

  describe('DatelikeMethodCriterion', function () {
    it('accepts valid date methods', function () {
      expect(DatelikeMethodCriterion.satisfiedBy('date.anytime')).to.be.true;
      expect(DatelikeMethodCriterion.satisfiedBy('date.past')).to.be.true;
      expect(DatelikeMethodCriterion.satisfiedBy('date.recent')).to.be.true;
      expect(DatelikeMethodCriterion.satisfiedBy('date.soon')).to.be.true;
      expect(DatelikeMethodCriterion.satisfiedBy('date.future')).to.be.true;
      expect(DatelikeMethodCriterion.satisfiedBy('date.between')).to.be.true;
    });

    it('rejects non-date methods', function () {
      expect(DatelikeMethodCriterion.satisfiedBy('string.uuid')).to.be.false;
      expect(DatelikeMethodCriterion.satisfiedBy('number.int')).to.be.false;
      expect(DatelikeMethodCriterion.satisfiedBy('date.birthdate')).to.be.false;
    });
  });

  describe('IdlikeMethodCriterion', function () {
    it('accepts valid ID methods', function () {
      // Structural ID generators
      expect(IdlikeMethodCriterion.satisfiedBy('string.alphanumeric')).to.be
        .true;
      expect(IdlikeMethodCriterion.satisfiedBy('string.uuid')).to.be.true;
      expect(IdlikeMethodCriterion.satisfiedBy('string.nanoid')).to.be.true;
      expect(IdlikeMethodCriterion.satisfiedBy('string.hexadecimal')).to.be
        .true;
      expect(IdlikeMethodCriterion.satisfiedBy('database.mongodbObjectId')).to
        .be.true;
      // LLM may generate an ID list
      expect(IdlikeMethodCriterion.satisfiedBy('helpers.arrayElement')).to.be
        .true;
    });

    it('rejects non-id methods', function () {
      expect(IdlikeMethodCriterion.satisfiedBy('number.int')).to.be.false;
      // string.alpha excludes digits — wrong shape for typical IDs
      expect(IdlikeMethodCriterion.satisfiedBy('string.alpha')).to.be.false;
    });

    it('rejects name methods that produce wrong-shape IDs', function () {
      expect(IdlikeMethodCriterion.satisfiedBy('person.fullName')).to.be.false;
      expect(IdlikeMethodCriterion.satisfiedBy('company.name')).to.be.false;
      expect(IdlikeMethodCriterion.satisfiedBy('commerce.productName')).to.be
        .false;
    });
  });

  describe('NumericFieldMethodCriterion', function () {
    it('accepts number.int and number.float', function () {
      expect(NumericFieldMethodCriterion.satisfiedBy('number.int')).to.be.true;
      expect(NumericFieldMethodCriterion.satisfiedBy('number.float')).to.be
        .true;
    });

    it('rejects string-returning methods like commerce.price', function () {
      expect(NumericFieldMethodCriterion.satisfiedBy('commerce.price')).to.be
        .false;
      expect(NumericFieldMethodCriterion.satisfiedBy('finance.amount')).to.be
        .false;
    });

    it('rejects unrelated methods', function () {
      expect(NumericFieldMethodCriterion.satisfiedBy('string.alphanumeric')).to
        .be.false;
      expect(NumericFieldMethodCriterion.satisfiedBy('helpers.arrayElement')).to
        .be.false;
    });
  });

  describe('SecondaryAddressCriterion', function () {
    it('accepts location.secondaryAddress and string.alphanumeric', function () {
      expect(SecondaryAddressCriterion.satisfiedBy('location.secondaryAddress'))
        .to.be.true;
      expect(SecondaryAddressCriterion.satisfiedBy('string.alphanumeric')).to.be
        .true;
    });

    it('rejects unrelated methods', function () {
      expect(SecondaryAddressCriterion.satisfiedBy('location.streetAddress')).to
        .be.false;
      expect(SecondaryAddressCriterion.satisfiedBy('number.int')).to.be.false;
    });
  });

  describe('GeoCoordinateMethodCriterion', function () {
    it('accepts location.latitude (always within [-90, 90])', function () {
      expect(GeoCoordinateMethodCriterion.satisfiedBy('location.latitude')).to
        .be.true;
    });

    it('accepts number.float', function () {
      expect(GeoCoordinateMethodCriterion.satisfiedBy('number.float')).to.be
        .true;
    });

    it('rejects location.longitude — values can exceed the [-90, 90] latitude slot', function () {
      expect(GeoCoordinateMethodCriterion.satisfiedBy('location.longitude')).to
        .be.false;
    });

    it('rejects unrelated and non-numeric methods', function () {
      expect(GeoCoordinateMethodCriterion.satisfiedBy('number.int')).to.be
        .false;
      expect(GeoCoordinateMethodCriterion.satisfiedBy('helpers.arrayElement'))
        .to.be.false;
      expect(GeoCoordinateMethodCriterion.satisfiedBy('string.alphanumeric')).to
        .be.false;
    });
  });

  describe('TokenStringMethodCriterion', function () {
    it('accepts structural and short-word string generators', function () {
      expect(TokenStringMethodCriterion.satisfiedBy('string.alphanumeric')).to
        .be.true;
      expect(TokenStringMethodCriterion.satisfiedBy('string.alpha')).to.be.true;
      expect(TokenStringMethodCriterion.satisfiedBy('string.numeric')).to.be
        .true;
      expect(TokenStringMethodCriterion.satisfiedBy('string.uuid')).to.be.true;
      expect(TokenStringMethodCriterion.satisfiedBy('lorem.word')).to.be.true;
      expect(TokenStringMethodCriterion.satisfiedBy('lorem.words')).to.be.true;
      expect(TokenStringMethodCriterion.satisfiedBy('lorem.slug')).to.be.true;
      expect(TokenStringMethodCriterion.satisfiedBy('helpers.arrayElement')).to
        .be.true;
    });

    it('rejects semantic-name string generators that would be shape-wrong for token fields', function () {
      // These methods produce multi-word human-flavored strings that don't resemble the
      // small-vocabulary tokens the field actually holds.
      expect(TokenStringMethodCriterion.satisfiedBy('person.firstName')).to.be
        .false;
      expect(TokenStringMethodCriterion.satisfiedBy('person.fullName')).to.be
        .false;
      expect(TokenStringMethodCriterion.satisfiedBy('company.name')).to.be
        .false;
      expect(TokenStringMethodCriterion.satisfiedBy('commerce.productName')).to
        .be.false;
      expect(TokenStringMethodCriterion.satisfiedBy('commerce.department')).to
        .be.false;
      expect(TokenStringMethodCriterion.satisfiedBy('book.title')).to.be.false;
      expect(TokenStringMethodCriterion.satisfiedBy('music.songName')).to.be
        .false;
    });
  });

  describe('GenericStringMethodCriterion', function () {
    it('is a strict superset of TokenStringMethodCriterion', function () {
      for (const method of TokenStringMethodCriterion.methods) {
        expect(
          GenericStringMethodCriterion.satisfiedBy(method),
          `expected GenericStringMethodCriterion to accept ${method}`
        ).to.be.true;
      }
    });

    it('additionally accepts semantic-name string generators (for ambiguous fields)', function () {
      expect(GenericStringMethodCriterion.satisfiedBy('person.fullName')).to.be
        .true;
      expect(GenericStringMethodCriterion.satisfiedBy('company.name')).to.be
        .true;
      expect(GenericStringMethodCriterion.satisfiedBy('commerce.productName'))
        .to.be.true;
    });

    it('rejects non-string-producing methods', function () {
      expect(GenericStringMethodCriterion.satisfiedBy('number.int')).to.be
        .false;
      expect(GenericStringMethodCriterion.satisfiedBy('date.past')).to.be.false;
      expect(GenericStringMethodCriterion.satisfiedBy('location.latitude')).to
        .be.false;
    });
  });

  describe('ShortPhraseStringCriterion', function () {
    it('accepts short-phrase / title-shape methods', function () {
      expect(ShortPhraseStringCriterion.satisfiedBy('lorem.word')).to.be.true;
      expect(ShortPhraseStringCriterion.satisfiedBy('lorem.words')).to.be.true;
      expect(ShortPhraseStringCriterion.satisfiedBy('lorem.sentence')).to.be
        .true;
      expect(ShortPhraseStringCriterion.satisfiedBy('book.title')).to.be.true;
      expect(ShortPhraseStringCriterion.satisfiedBy('music.songName')).to.be
        .true;
      // LLM may generate a title list
      expect(ShortPhraseStringCriterion.satisfiedBy('helpers.arrayElement')).to
        .be.true;
    });

    it('rejects prose-shaped methods (those belong on LoremTextMethodCriterion)', function () {
      // Multi-sentence / paragraph methods would produce wrong-shape output
      // for a title field.
      expect(ShortPhraseStringCriterion.satisfiedBy('lorem.paragraph')).to.be
        .false;
      expect(ShortPhraseStringCriterion.satisfiedBy('lorem.paragraphs')).to.be
        .false;
      expect(ShortPhraseStringCriterion.satisfiedBy('lorem.text')).to.be.false;
    });

    it('rejects person/company name methods', function () {
      expect(ShortPhraseStringCriterion.satisfiedBy('person.fullName')).to.be
        .false;
      expect(ShortPhraseStringCriterion.satisfiedBy('company.name')).to.be
        .false;
    });
  });

  describe('isEvalCriterion', function () {
    it('returns true for EvalCriterion objects', function () {
      expect(isEvalCriterion(DatelikeMethodCriterion)).to.be.true;
      expect(isEvalCriterion(IdlikeMethodCriterion)).to.be.true;
      expect(isEvalCriterion(NumericFieldMethodCriterion)).to.be.true;
      expect(isEvalCriterion(SecondaryAddressCriterion)).to.be.true;
      expect(isEvalCriterion(GeoCoordinateMethodCriterion)).to.be.true;
    });

    it('returns false for strings and other values', function () {
      expect(isEvalCriterion('date.past')).to.be.false;
      expect(isEvalCriterion(null)).to.be.false;
      expect(isEvalCriterion(42)).to.be.false;
      expect(isEvalCriterion({ name: 'x' })).to.be.false;
    });
  });
});

describe('Mock Data Scorers', function () {
  describe('withSkipResultOnUnexpected', function () {
    it('returns null for all scorers when errorType is UNEXPECTED_EVAL_ERROR', async function () {
      const args = makeArgs({
        errorType: 'UNEXPECTED_EVAL_ERROR',
        outputFields: [],
      });

      expect(await FakerFieldNameAccuracy(args)).to.be.null;
      expect(await FakerMethodSuggestionAccuracy(args)).to.be.null;
      expect(await PercentRecognizedScorer(args)).to.be.null;
      expect(await FakerArgParseableScorer(args)).to.be.null;
      expect(await MethodRunnableScorer(args)).to.be.null;
      expect(await FakerSampleValueAccuracy(args)).to.be.null;
    });
  });

  describe('FakerFieldNameAccuracy', function () {
    it('scores 1.0 when all field paths match', async function () {
      const result = await FakerFieldNameAccuracy(makeArgs());
      expect(result).to.have.property('name', 'FakerFieldNameAccuracy');
      expect(result).to.have.property('score', 1);
    });

    it('scores 0 when no field paths match', async function () {
      const result = await FakerFieldNameAccuracy(
        makeArgs({
          outputFields: [
            {
              fieldPath: 'wrong',
              fakerMethod: 'person.fullName',
              fakerArgs: [],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 0);
    });

    it('scores 0.5 when half of field paths match', async function () {
      const result = await FakerFieldNameAccuracy(
        makeArgs({
          outputFields: [
            {
              fieldPath: 'name',
              fakerMethod: 'person.fullName',
              fakerArgs: [],
            },
            {
              fieldPath: 'wrong',
              fakerMethod: 'number.int',
              fakerArgs: [],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 0.5);
    });
  });

  describe('FakerMethodSuggestionAccuracy', function () {
    it('scores 1.0 when all methods match exactly', async function () {
      const result = await FakerMethodSuggestionAccuracy(makeArgs());
      expect(result).to.have.property('name', 'FakerMethodSuggestionAccuracy');
      expect(result).to.have.property('score', 1);
    });

    it('scores 0 when methods differ', async function () {
      const result = await FakerMethodSuggestionAccuracy(
        makeArgs({
          outputFields: [
            {
              fieldPath: 'name',
              fakerMethod: 'lorem.word',
              fakerArgs: [],
            },
            {
              fieldPath: 'age',
              fakerMethod: 'string.alphanumeric',
              fakerArgs: [],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 0);
    });

    it('scores 1.0 when EvalCriterion is satisfied', async function () {
      const result = await FakerMethodSuggestionAccuracy(
        makeArgs({
          providedSchema: {
            created: { type: 'Date', probability: 1 },
          },
          expectedFields: [
            {
              fieldPath: 'created',
              fakerMethod: DatelikeMethodCriterion,
              fakerArgs: [],
            },
          ],
          outputFields: [
            {
              fieldPath: 'created',
              fakerMethod: 'date.past',
              fakerArgs: [],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 1);
    });

    it('scores 0 when EvalCriterion is not satisfied', async function () {
      const result = await FakerMethodSuggestionAccuracy(
        makeArgs({
          providedSchema: {
            created: { type: 'Date', probability: 1 },
          },
          expectedFields: [
            {
              fieldPath: 'created',
              fakerMethod: DatelikeMethodCriterion,
              fakerArgs: [],
            },
          ],
          outputFields: [
            {
              fieldPath: 'created',
              fakerMethod: 'number.int',
              fakerArgs: [],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 0);
    });

    it('accepts helpers.arrayElement when field has sampleValues', async function () {
      const result = await FakerMethodSuggestionAccuracy(
        makeArgs({
          providedSchema: {
            status: {
              type: 'String',
              probability: 1,
              sampleValues: ['active', 'inactive'],
            },
          },
          expectedFields: [
            {
              fieldPath: 'status',
              fakerMethod: 'string.alphanumeric',
              fakerArgs: [],
            },
          ],
          outputFields: [
            {
              fieldPath: 'status',
              fakerMethod: 'helpers.arrayElement',
              fakerArgs: [{ json: '["active", "inactive"]' }],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 1);
    });

    it('rejects helpers.arrayElements even when field has sampleValues', async function () {
      // arrayElements returns an array; the generator wraps every faker call
      // in Array.from, so arrayElements produces nested arrays (wrong type).
      const result = await FakerMethodSuggestionAccuracy(
        makeArgs({
          providedSchema: {
            'tags[]': {
              type: 'String',
              probability: 1,
              sampleValues: ['red', 'blue'],
            },
          },
          expectedFields: [
            {
              fieldPath: 'tags[]',
              fakerMethod: 'helpers.arrayElement',
              fakerArgs: [],
            },
          ],
          outputFields: [
            {
              fieldPath: 'tags[]',
              fakerMethod: 'helpers.arrayElements',
              fakerArgs: [{ json: '["red", "blue"]' }],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 0);
    });
  });

  describe('PercentRecognizedScorer', function () {
    it('scores 1.0 when no fields are unrecognized', async function () {
      const result = await PercentRecognizedScorer(makeArgs());
      expect(result).to.have.property('name', 'FakerFieldPercentRecognized');
      expect(result).to.have.property('score', 1);
    });

    it('scores 0.5 when half of fields are unrecognized', async function () {
      const result = await PercentRecognizedScorer(
        makeArgs({
          outputFields: [
            {
              fieldPath: 'name',
              fakerMethod: 'person.fullName',
              fakerArgs: [],
            },
            {
              fieldPath: 'age',
              fakerMethod: 'unrecognized',
              fakerArgs: [],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 0.5);
    });

    it('scores 0 when all fields are unrecognized', async function () {
      const result = await PercentRecognizedScorer(
        makeArgs({
          outputFields: [
            {
              fieldPath: 'name',
              fakerMethod: 'unrecognized',
              fakerArgs: [],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 0);
    });

    it('scores 0 for empty output', async function () {
      const result = await PercentRecognizedScorer(
        makeArgs({ outputFields: [] })
      );
      expect(result).to.have.property('score', 0);
    });
  });

  describe('FakerArgParseableScorer', function () {
    it('scores 1.0 when there are no json args', async function () {
      const result = await FakerArgParseableScorer(makeArgs());
      expect(result).to.have.property('name', 'FakerArgParseableScorer');
      expect(result).to.have.property('score', 1);
    });

    it('scores 1.0 when all json args parse to objects/arrays', async function () {
      const result = await FakerArgParseableScorer(
        makeArgs({
          outputFields: [
            {
              fieldPath: 'age',
              fakerMethod: 'number.int',
              fakerArgs: [{ json: '{"min":1,"max":99}' }],
            },
            {
              fieldPath: 'tags',
              fakerMethod: 'helpers.arrayElement',
              fakerArgs: [{ json: '["a","b"]' }],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 1);
    });

    it('scores 0 when json args are invalid', async function () {
      const result = await FakerArgParseableScorer(
        makeArgs({
          outputFields: [
            {
              fieldPath: 'bad',
              fakerMethod: 'number.int',
              fakerArgs: [{ json: '{not valid json' }],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 0);
    });

    it('scores 0 when json parses to a primitive', async function () {
      const result = await FakerArgParseableScorer(
        makeArgs({
          outputFields: [
            {
              fieldPath: 'bad',
              fakerMethod: 'number.int',
              fakerArgs: [{ json: '3' }],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 0);
    });
  });

  describe('MethodRunnableScorer', function () {
    it('scores 1.0 when all methods are runnable', async function () {
      const result = await MethodRunnableScorer(
        makeArgs({
          outputFields: [
            {
              fieldPath: 'name',
              fakerMethod: 'person.fullName',
              fakerArgs: [],
            },
            {
              fieldPath: 'age',
              fakerMethod: 'number.int',
              fakerArgs: [],
            },
          ],
        })
      );
      expect(result).to.have.property('name', 'FakerMethodRunnableScorer');
      expect(result).to.have.property('score', 1);
    });

    it('scores 0 when methods are hallucinated', async function () {
      const result = await MethodRunnableScorer(
        makeArgs({
          outputFields: [
            {
              fieldPath: 'x',
              fakerMethod: 'nonexistent.method',
              fakerArgs: [],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 0);
    });

    it('skips unrecognized methods from scoring', async function () {
      const result = await MethodRunnableScorer(
        makeArgs({
          outputFields: [
            {
              fieldPath: 'name',
              fakerMethod: 'person.fullName',
              fakerArgs: [],
            },
            {
              fieldPath: 'unknown',
              fakerMethod: 'unrecognized',
              fakerArgs: [],
            },
          ],
        })
      );
      // Only 1 recognized method (person.fullName), which is runnable
      expect(result).to.have.property('score', 1);
    });

    it('scores 0 for empty output', async function () {
      const result = await MethodRunnableScorer(makeArgs({ outputFields: [] }));
      expect(result).to.have.property('score', 0);
    });

    it('runs methods with parsed json args', async function () {
      const result = await MethodRunnableScorer(
        makeArgs({
          outputFields: [
            {
              fieldPath: 'age',
              fakerMethod: 'number.int',
              fakerArgs: [{ json: '{"min":1,"max":99}' }],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 1);
    });
  });

  describe('FakerSampleValueAccuracy', function () {
    it('scores 1.0 when no field uses helpers.arrayElement', async function () {
      const result = await FakerSampleValueAccuracy(makeArgs());
      expect(result).to.have.property('name', 'FakerSampleValueAccuracy');
      expect(result).to.have.property('score', 1);
    });

    it('scores 1.0 when arrayElement args are a subset of sampleValues', async function () {
      const result = await FakerSampleValueAccuracy(
        makeArgs({
          providedSchema: {
            status: {
              type: 'String',
              probability: 1,
              sampleValues: ['active', 'inactive', 'pending'],
            },
          },
          outputFields: [
            {
              fieldPath: 'status',
              fakerMethod: 'helpers.arrayElement',
              fakerArgs: [{ json: '["active", "inactive"]' }],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 1);
    });

    it('scores 0 when an arg value is not in sampleValues', async function () {
      const result = await FakerSampleValueAccuracy(
        makeArgs({
          providedSchema: {
            status: {
              type: 'String',
              probability: 1,
              sampleValues: ['active', 'inactive'],
            },
          },
          outputFields: [
            {
              fieldPath: 'status',
              fakerMethod: 'helpers.arrayElement',
              fakerArgs: [{ json: '["active", "hallucinated"]' }],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 0);
    });

    it('skips when arrayElement field has no sampleValues', async function () {
      // Sample Value Accuracy measures whether the LLM correctly used
      // provided sampleValues. If none were provided the scorer has nothing
      // to validate, so the field is not counted in `checked`. The scorer's
      // default 1.0 then applies.
      const result = await FakerSampleValueAccuracy(
        makeArgs({
          providedSchema: {
            name: { type: 'String', probability: 1 },
          },
          outputFields: [
            {
              fieldPath: 'name',
              fakerMethod: 'helpers.arrayElement',
              fakerArgs: [{ json: '["Alice"]' }],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 1);
    });

    it('scores 0 when arg value is missing', async function () {
      const result = await FakerSampleValueAccuracy(
        makeArgs({
          providedSchema: {
            status: {
              type: 'String',
              probability: 1,
              sampleValues: ['active'],
            },
          },
          outputFields: [
            {
              fieldPath: 'status',
              fakerMethod: 'helpers.arrayElement',
              fakerArgs: [],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 0);
    });

    it('scores 0 when array arg is unparseable', async function () {
      const result = await FakerSampleValueAccuracy(
        makeArgs({
          providedSchema: {
            status: {
              type: 'String',
              probability: 1,
              sampleValues: ['active'],
            },
          },
          outputFields: [
            {
              fieldPath: 'status',
              fakerMethod: 'helpers.arrayElement',
              fakerArgs: [{ json: '{not valid json' }],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 0);
    });

    it('scores 0 when helpers.arrayElements is used (always wrong-typed in generator)', async function () {
      const result = await FakerSampleValueAccuracy(
        makeArgs({
          providedSchema: {
            'tags[]': {
              type: 'String',
              probability: 1,
              sampleValues: ['red', 'blue', 'green'],
            },
          },
          outputFields: [
            {
              fieldPath: 'tags[]',
              fakerMethod: 'helpers.arrayElements',
              fakerArgs: [{ json: '["red", "blue"]' }],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 0);
    });

    it('filters null/undefined from sampleValues before comparing', async function () {
      // Real-world schemas often include null in sampleValues for nullable fields.
      // The scorer should not treat 'null' as a valid arg value.
      const result = await FakerSampleValueAccuracy(
        makeArgs({
          providedSchema: {
            status: {
              type: 'String',
              probability: 0.8,
              sampleValues: ['active', null, 'inactive'],
            },
          },
          outputFields: [
            {
              fieldPath: 'status',
              fakerMethod: 'helpers.arrayElement',
              fakerArgs: [{ json: '["active", "inactive"]' }],
            },
          ],
        })
      );
      expect(result).to.have.property('score', 1);
    });
  });
});
