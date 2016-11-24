const React = require('react');
const { expect } = require('chai');
const {
  getElementComponent,
  ElementBinaryValue,
  ElementCodeValue,
  ElementDateValue,
  ElementValue,
  ElementDoubleValue,
  ElementInt32Value,
  ElementKeyValue,
  ElementRegexValue
} = require('../../');

describe('#getElementComponent', () => {
  context('when the type is Binary', () => {
    it('returns a binary value component', () => {
      expect(getElementComponent('Binary')).to.deep.equal(ElementBinaryValue);
    });
  });

  context('when the type is Code', () => {
    it('returns a code value component', () => {
      expect(getElementComponent('Code')).to.deep.equal(ElementCodeValue);
    });
  });

  context('when the type is Date', () => {
    it('returns a date value component', () => {
      expect(getElementComponent('Date')).to.deep.equal(ElementDateValue);
    });
  });

  context('when the type is Decimal128', () => {
    it('returns an element value component', () => {
      expect(getElementComponent('Decimal128')).to.deep.equal(ElementValue);
    });
  });

  context('when the type is Double', () => {
    it('returns a double value component', () => {
      expect(getElementComponent('Double')).to.deep.equal(ElementDoubleValue);
    });
  });

  context('when the type is Int32', () => {
    it('returns an int32 value component', () => {
      expect(getElementComponent('Int32')).to.deep.equal(ElementInt32Value);
    });
  });

  context('when the type is Int64', () => {
    it('returns an element value component', () => {
      expect(getElementComponent('Int64')).to.deep.equal(ElementValue);
    });
  });

  context('when the type is MaxKey', () => {
    it('returns an element key value component', () => {
      expect(getElementComponent('MaxKey')).to.deep.equal(ElementKeyValue);
    });
  });

  context('when the type is MinKey', () => {
    it('returns an element key value component', () => {
      expect(getElementComponent('MinKey')).to.deep.equal(ElementKeyValue);
    });
  });

  context('when the type is ObjectId', () => {
    it('returns an element value component', () => {
      expect(getElementComponent('ObjectId')).to.deep.equal(ElementValue);
    });
  });

  context('when the type is String', () => {
    it('returns an element value component', () => {
      expect(getElementComponent('String')).to.deep.equal(ElementValue);
    });
  });

  context('when the type is a BSONRegExp', () => {
    it('returns an element regex component', () => {
      expect(getElementComponent('BSONRegExp')).to.deep.equal(ElementRegexValue);
    });
  });
});
