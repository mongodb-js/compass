import { expect } from 'chai';
import {
  assertNoUnsafeIntegers,
  UnsafeIntegerValidationError,
} from './../src/unsafe-integer-validation';

describe('assertNoUnsafeIntegers', function () {
  it('does not throw for safe integers', function () {
    const safeIntegers = [
      '0',
      '1',
      '-1',
      '9007199254740991', // Number.MAX_SAFE_INTEGER
      '-9007199254740991', // Number.MIN_SAFE_INTEGER
    ];
    for (const safeInteger of safeIntegers) {
      assertNoUnsafeIntegers(safeInteger);
    }
  });

  it('throws for unsafe integers', function () {
    const unsafeIntegers = [
      '9007199254740992', // Number.MAX_SAFE_INTEGER + 1
      '-9007199254740992', // Number.MIN_SAFE_INTEGER - 1
    ];
    for (const unsafeInteger of unsafeIntegers) {
      try {
        assertNoUnsafeIntegers(unsafeInteger);
        expect.fail(
          `Expected assertNoUnsafeIntegers to throw for unsafe integer: ${unsafeInteger}`
        );
      } catch (error) {
        expect(error).to.be.instanceOf(UnsafeIntegerValidationError);
        const validationError = error as UnsafeIntegerValidationError;
        expect(validationError.violations).to.have.lengthOf(1);
        expect(validationError.violations[0].source).to.equal(unsafeInteger);
      }
    }
  });

  it('correctly identifies violations', function () {
    const jsonString = '{"value": 9007199254740992}';
    try {
      assertNoUnsafeIntegers(jsonString);
      expect.fail(
        'Expected assertNoUnsafeIntegers to throw for unsafe integer in JSON string'
      );
    } catch (error) {
      const validationError = error as UnsafeIntegerValidationError;
      expect(validationError.violations[0].source).to.equal('9007199254740992');
      expect(validationError.violations[0].loc.from).to.equal(10);
      expect(validationError.violations[0].loc.to).to.equal(26);
    }
  });

  it('correctly identifies violations with repeated unsafe integers', function () {
    const jsonString =
      '{"value": 9007199254740992, "anotherValue": 9007199254740992}';
    try {
      assertNoUnsafeIntegers(jsonString);
      expect.fail(
        'Expected assertNoUnsafeIntegers to throw for unsafe integer in JSON string'
      );
    } catch (error) {
      const validationError = error as UnsafeIntegerValidationError;
      expect(validationError.violations).to.have.lengthOf(2);
      expect(validationError.violations[0].source).to.equal('9007199254740992');
      expect(validationError.violations[1].source).to.equal('9007199254740992');

      expect(validationError.violations[0].loc.from).to.equal(10);
      expect(validationError.violations[0].loc.to).to.equal(26);
      expect(validationError.violations[1].loc.from).to.equal(44);
      expect(validationError.violations[1].loc.to).to.equal(60);
    }
  });

  it('correctly identifies violations with repeated string/integer combo - 1', function () {
    const jsonString =
      '{"value": "9007199254740992", "anotherValue": 9007199254740992}';
    try {
      assertNoUnsafeIntegers(jsonString);
      expect.fail(
        'Expected assertNoUnsafeIntegers to throw for unsafe integer in JSON string'
      );
    } catch (error) {
      const validationError = error as UnsafeIntegerValidationError;
      expect(validationError.violations).to.have.lengthOf(1);
      expect(validationError.violations[0].source).to.equal('9007199254740992');
      expect(validationError.violations[0].loc.from).to.equal(46);
      expect(validationError.violations[0].loc.to).to.equal(62);
    }
  });

  it('correctly identifies violations with repeated string/integer combo - 2', function () {
    const jsonString =
      '{"value": "some string with 9007199254740992 in it", "anotherValue": 9007199254740992, "yetAnotherValue": "9007199254740992"}';
    try {
      assertNoUnsafeIntegers(jsonString);
      expect.fail(
        'Expected assertNoUnsafeIntegers to throw for unsafe integer in JSON string'
      );
    } catch (error) {
      const validationError = error as UnsafeIntegerValidationError;
      expect(validationError.violations).to.have.lengthOf(1);
      expect(validationError.violations[0].source).to.equal('9007199254740992');
      expect(validationError.violations[0].loc.from).to.equal(69);
      expect(validationError.violations[0].loc.to).to.equal(85);
    }
  });

  it('does not throw for invalid JSON (lets the caller handle parse errors)', function () {
    const invalidJson = [
      '{invalid json}',
      '{"a": }',
      '',
      'undefined',
      '{a: 9007199254740992}',
    ];
    for (const input of invalidJson) {
      expect(() => assertNoUnsafeIntegers(input)).to.not.throw(
        'UnsafeIntegerValidationError'
      );
    }
  });

  it('does not throw if JSON contains a number less than 16 digits', function () {
    expect(
      () => assertNoUnsafeIntegers('{"value": 900719925474099}'),
      'json with 15digit number'
    ).to.not.throw('UnsafeIntegerValidationError');
    expect(
      () =>
        assertNoUnsafeIntegers(
          '{"value": 9007199254740991, "other": "90071992547409919999"}'
        ),
      'json with 15digit number followed by a long string that contains >16digit number'
    ).to.not.throw('UnsafeIntegerValidationError');
  });
});
