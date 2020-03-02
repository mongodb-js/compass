import React from 'react';
import { expect } from 'chai';
import {
  getComponent,
  BinaryValue,
  CodeValue,
  DateValue,
  Value,
  DoubleValue,
  Int32Value,
  KeyValue,
  RegexValue,
  DBRefValue,
  StringValue
} from '../';

describe('#getComponent', () => {
  context('when the type is Binary', () => {
    it('returns a binary value component', () => {
      expect(getComponent('Binary')).to.deep.equal(BinaryValue);
    });
  });

  context('when the type is Code', () => {
    it('returns a code value component', () => {
      expect(getComponent('Code')).to.deep.equal(CodeValue);
    });
  });

  context('when the type is Date', () => {
    it('returns a date value component', () => {
      expect(getComponent('Date')).to.deep.equal(DateValue);
    });
  });

  context('when the type is Decimal128', () => {
    it('returns an element value component', () => {
      expect(getComponent('Decimal128')).to.deep.equal(Value);
    });
  });

  context('when the type is Double', () => {
    it('returns a double value component', () => {
      expect(getComponent('Double')).to.deep.equal(DoubleValue);
    });
  });

  context('when the type is Int32', () => {
    it('returns an int32 value component', () => {
      expect(getComponent('Int32')).to.deep.equal(Int32Value);
    });
  });

  context('when the type is Int64', () => {
    it('returns an element value component', () => {
      expect(getComponent('Int64')).to.deep.equal(Value);
    });
  });

  context('when the type is MaxKey', () => {
    it('returns an element key value component', () => {
      expect(getComponent('MaxKey')).to.deep.equal(KeyValue);
    });
  });

  context('when the type is MinKey', () => {
    it('returns an element key value component', () => {
      expect(getComponent('MinKey')).to.deep.equal(KeyValue);
    });
  });

  context('when the type is ObjectId', () => {
    it('returns an element value component', () => {
      expect(getComponent('ObjectId')).to.deep.equal(Value);
    });
  });

  context('when the type is String', () => {
    it('returns an element value component', () => {
      expect(getComponent('String')).to.deep.equal(StringValue);
    });
  });

  context('when the type is a BSONRegExp', () => {
    it('returns an element regex component', () => {
      expect(getComponent('BSONRegExp')).to.deep.equal(RegexValue);
    });
  });

  context('when the type is Symbol', () => {
    it('returns an element value component', () => {
      expect(getComponent('Symbol')).to.deep.equal(Value);
    });
  });

  context('when the type is Timestamp', () => {
    it('returns an element value component', () => {
      expect(getComponent('Timestamp')).to.deep.equal(Value);
    });
  });

  context('when the type is Undefined', () => {
    it('returns an element value component', () => {
      expect(getComponent('Undefined')).to.deep.equal(Value);
    });
  });

  context('when the type is Null', () => {
    it('returns an element value component', () => {
      expect(getComponent('Null')).to.deep.equal(Value);
    });
  });

  context('when the type is Boolean', () => {
    it('returns an element value component', () => {
      expect(getComponent('Boolean')).to.deep.equal(Value);
    });
  });

  context('when the type is DBRef', () => {
    it('returns an element dbref value component', () => {
      expect(getComponent('DBRef')).to.deep.equal(DBRefValue);
    });
  });
});
