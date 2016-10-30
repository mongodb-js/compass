/* eslint no-unused-expressions: 0 */

const expect = require('chai').expect;
const ValidationStore = require('../src/internal-packages/validation/lib/stores');
const sinon = require('sinon');
const _ = require('lodash');

function mockFetchFromServer(err, res, delay) {
  if (delay === undefined) {
    delay = 0;
  }
  ValidationStore._fetchFromServer = function(callback) {
    setTimeout(function() {
      return callback(err, res);
    }, delay);
  };
}

const mockValidatorDoc = {
  'name': 'test',
  'options': {
    'validator': {
      'number': {
        '$exists': true
      },
      'last_name': {
        '$regex': '^foo'
      }
    },
    'validationLevel': 'strict',
    'validationAction': 'error'
  }
};


describe('ValidationStore', function() {
  let unsubscribe;

  beforeEach(function() {
    // reset the store to initial values
    unsubscribe = function() {};
    ValidationStore.setState(ValidationStore.getInitialState());
  });

  afterEach(function() {
    unsubscribe();
    unsubscribe = function() {};
  });


  it('goes into {fetchState: "fetching"} when starting to fetch from server', function(done) {
    mockFetchFromServer(null, mockValidatorDoc);

    unsubscribe = ValidationStore.listen((state) => {
      expect(state.fetchState).to.be.equal('fetching');
      done();
    });
    ValidationStore.fetchValidationRules();
  });

  it('goes into {fetchState: "success"} when receiving a valid validator doc', function(done) {
    mockFetchFromServer(null, mockValidatorDoc);

    const spy = sinon.spy();
    unsubscribe = ValidationStore.listen(spy);
    ValidationStore.fetchValidationRules();

    setTimeout(() => {
      expect(spy.secondCall.args[0].fetchState).to.be.equal('success');
      done();
    }, 10);
  });

  it('goes into {fetchState: "error"} when receiving an error back', function(done) {
    mockFetchFromServer(new Error('permission denied.'));

    const spy = sinon.spy();
    unsubscribe = ValidationStore.listen(spy);
    ValidationStore.fetchValidationRules();

    setTimeout(() => {
      expect(spy.callCount).to.be.equal(2);
      expect(spy.secondCall.args[0].fetchState).to.be.equal('error');
      done();
    }, 10);
  });

  it.skip('goes into {fetchState: "error"} when receiving an invalid validator doc', function(done) {
    mockFetchFromServer(null, {nonsense: true, format: 'invalid'});

    const spy = sinon.spy();
    unsubscribe = ValidationStore.listen(spy);
    ValidationStore.fetchValidationRules();

    setTimeout(() => {
      expect(spy.callCount).to.be.equal(2);
      expect(spy.secondCall.args[0].fetchState).to.be.equal('error');
      done();
    }, 10);
  });

  it.skip('goes into {fetchState: "error"} when the result is not an object', function(done) {
    mockFetchFromServer(null, 'I am not an object, I am a string!');

    const spy = sinon.spy();
    unsubscribe = ValidationStore.listen(spy);
    ValidationStore.fetchValidationRules();

    setTimeout(() => {
      expect(spy.callCount).to.be.equal(2);
      expect(spy.secondCall.args[0].fetchState).to.be.equal('error');
      done();
    }, 10);
  });

  it('successfully fetches and converts a valid validator doc', function(done) {
    mockFetchFromServer(null, mockValidatorDoc);

    const spy = sinon.spy();
    unsubscribe = ValidationStore.listen(spy);
    ValidationStore.fetchValidationRules();

    setTimeout(() => {
      expect(spy.callCount).to.be.equal(2);
      expect(spy.secondCall.args[0].fetchState).to.be.equal('success');
      expect(spy.secondCall.args[0].validationRules).is.an('array');
      expect(spy.secondCall.args[0].validationRules).to.have.lengthOf(2);
      expect(spy.secondCall.args[0].validationLevel).to.be.equal('strict');
      expect(spy.secondCall.args[0].validationAction).to.be.equal('error');
      expect(spy.secondCall.args[0].editState).to.be.equal('unmodified');
      expect(spy.secondCall.args[0].isExpressibleByRules).to.be.true;
      done();
    }, 10);
  });

  it('deconstructs a {$exists: true} clause from the server correctly', function() {
    // insert fixture data
    const validatorDoc = {
      'validator': {
        'age': {
          '$exists': true
        }
      },
      'validationLevel': 'strict',
      'validationAction': 'error'
    };
    const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
    expect(result.rules).to.be.an('array');
    expect(result.rules[0].field).to.be.equal('age');
    expect(result.rules[0].category).to.be.equal('exists');
    expect(result.rules[0].nullable).to.be.false;
    expect(result.rules[0].parameters).to.be.deep.equal({});
  });

  it('deconstructs a {$exists: false} clause from the server correctly', function() {
    // insert fixture data
    const validatorDoc = {
      'validator': {
        'age': {
          '$exists': false
        }
      },
      'validationLevel': 'strict',
      'validationAction': 'error'
    };
    const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
    expect(result.rules).to.be.an('array');
    expect(result.rules[0].field).to.be.equal('age');
    expect(result.rules[0].category).to.be.equal('mustNotExist');
    expect(result.rules[0].nullable).to.be.false;
    expect(result.rules[0].parameters).to.be.deep.equal({});
  });

  it('deconstructs a $regex clause from the server correctly', function() {
    // insert fixture data
    const validatorDoc = {
      'validator': {
        'name': {
          '$regex': '^Tom',
          '$options': 'ix'
        }
      },
      'validationLevel': 'strict',
      'validationAction': 'error'
    };
    const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
    expect(result.rules).to.be.an('array');
    expect(result.rules[0].field).to.be.equal('name');
    expect(result.rules[0].category).to.be.equal('regex');
    expect(result.rules[0].nullable).to.be.false;
    expect(result.rules[0].parameters).to.be.deep.equal({
      regex: '^Tom',
      options: 'ix'
    });
  });

  it('constructs a $regex clause from the rules', function() {
    // insert fixture data
    const validatorDoc = {
      'validator': {
        'name': {
          '$regex': '^Tom',
          '$options': 'ix'
        }
      },
      'validationLevel': 'strict',
      'validationAction': 'error'
    };
    const rules = ValidationStore._deconstructValidatorDoc(validatorDoc);
    const result = ValidationStore._constructValidatorDoc(rules);
    expect(result).to.deep.equal(validatorDoc);
  });

  it('deconstruct a nullable $regex clause into rules', function() {
    // insert fixture data
    const innerQuery = {
      name: {
        '$regex': '^Tom',
        '$options': 'ix'
      }
    };
    const validatorDoc = {
      'validator': {
        $or: [
          innerQuery,
          {name: {$exists: false}},
          {name: null}
        ]
      },
      'validationLevel': 'strict',
      'validationAction': 'error'
    };
    const rules = {
      rules: [
        {
          id: 'my-rule-id',
          field: 'name',
          category: 'regex',
          parameters: {
            regex: '^Tom',
            options: 'ix'
          },
          nullable: true
        }
      ],
      level: 'strict',
      action: 'error'
    };

    const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
    expect(_.omit(result.rules[0], 'id')).to.deep.equal(_.omit(rules.rules[0], 'id'));
  });

  it('constructs multiple rules with nullable wrapped in $and', function() {
    // insert fixture data
    const rules = {
      rules: [
        {
          id: 'my-rule-id-1',
          field: 'name',
          category: 'regex',
          parameters: {
            regex: '^Tom',
            options: 'ix'
          },
          nullable: true
        },
        {
          id: 'my-rule-id-2',
          field: 'mission',
          category: 'regex',
          parameters: {
            regex: '^XKCD',
            options: 'mx'
          },
          nullable: true
        }
      ],
      level: 'strict',
      action: 'error'
    };
    const innerQueryA = {
      name: {
        '$regex': '^Tom',
        '$options': 'ix'
      }
    };
    const innerQueryB = {
      mission: {
        '$regex': '^XKCD',
        '$options': 'mx'
      }
    };
    const validatorDoc = {
      'validator': {
        $and: [
          {
            $or: [
              innerQueryA,
              {name: {$exists: false}},
              {name: null}
            ]
          },
          {
            $or: [
              innerQueryB,
              {mission: {$exists: false}},
              {mission: null}
            ]
          }
        ]
      },
      'validationLevel': 'strict',
      'validationAction': 'error'
    };

    const result = ValidationStore._constructValidatorDoc(rules);
    expect(result).to.deep.equal(validatorDoc);
  });

  it('deconstructs a pair of nullable $regex clause with $and into rules', function() {
    // insert fixture data
    const rules = {
      rules: [
        {
          id: 'my-rule-id-1',
          field: 'name',
          category: 'regex',
          parameters: {
            regex: '^Tom',
            options: 'ix'
          },
          nullable: true
        },
        {
          id: 'my-rule-id-2',
          field: 'mission',
          category: 'regex',
          parameters: {
            regex: '^XKCD',
            options: 'mx'
          },
          nullable: true
        }
      ],
      level: 'strict',
      action: 'error'
    };
    const innerQueryA = {
      name: {
        '$regex': '^Tom',
        '$options': 'ix'
      }
    };
    const innerQueryB = {
      mission: {
        '$regex': '^XKCD',
        '$options': 'mx'
      }
    };
    const validatorDoc = {
      'validator': {
        $and: [
          {
            $or: [
              innerQueryA,
              {name: {$exists: false}},
              {name: null}
            ]
          },
          {
            $or: [
              innerQueryB,
              {mission: {$exists: false}},
              {mission: null}
            ]
          }
        ]
      },
      'validationLevel': 'strict',
      'validationAction': 'error'
    };

    const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
    expect(_.omit(result.rules[0], 'id')).to.deep.equal(_.omit(rules.rules[0], 'id'));
  });

  // extra rule to some $and of nullable rules
  it('adds an extra rule to some nullalble rules should put it within $and', function() {
    // insert fixture data
    const rules = {
      rules: [
        {
          id: 'my-rule-id-1',
          field: 'name',
          category: 'regex',
          parameters: {
            regex: '^Tom',
            options: 'ix'
          },
          nullable: true
        },
        {
          id: 'my-rule-id-2',
          field: 'mission',
          category: 'regex',
          parameters: {
            regex: '^XKCD',
            options: 'mx'
          },
          nullable: true
        },
        {
          id: 'my-rule-id-3',
          field: 'logo',
          category: 'exists',
          nullable: false
        }
      ],
      level: 'strict',
      action: 'error'
    };
    const innerQueryA = {
      name: {
        '$regex': '^Tom',
        '$options': 'ix'
      }
    };
    const innerQueryB = {
      mission: {
        '$regex': '^XKCD',
        '$options': 'mx'
      }
    };
    const validatorDoc = {
      'validator': {
        $and: [
          {
            $or: [
              innerQueryA,
              {name: {$exists: false}},
              {name: null}
            ]
          },
          {
            $or: [
              innerQueryB,
              {mission: {$exists: false}},
              {mission: null}
            ]
          },
          {
            'logo': {
              '$exists': true
            }
          }
        ]
      },
      'validationLevel': 'strict',
      'validationAction': 'error'
    };

    const result = ValidationStore._constructValidatorDoc(rules);
    expect(result).to.deep.equal(validatorDoc);
  });

  it('recognizes when validator document cannot be expressed by rules', function() {
    // insert fixture data
    const validatorDoc = {
      'validator': {
        'name': {
          '$regex': '^Tom'
        },
        'city': {
          '$in': ['New York', 'Sydney', 'Berlin', 'Stockholm', 'Philadelphia']
        }
      },
      'validationLevel': 'strict',
      'validationAction': 'error'
    };
    const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
    expect(result.rules).to.be.false;
    expect(result.level).to.be.equal('strict');
    expect(result.action).to.be.equal('error');
  });

  it('constructs a nullable $regex clause from the rules', function() {
    // insert fixture data
    const innerQuery = {
      name: {
        '$regex': '^Tom',
        '$options': 'ix'
      }
    };
    const validatorDoc = {
      'validator': {
        $or: [
          innerQuery,
          {name: {$exists: false}},
          {name: null}
        ]
      },
      'validationLevel': 'strict',
      'validationAction': 'error'
    };
    const rules = {
      rules: [
        {
          id: 'my-rule-id',
          field: 'name',
          category: 'regex',
          parameters: {
            regex: '^Tom',
            options: 'ix'
          },
          nullable: true
        }
      ],
      level: 'strict',
      action: 'error'
    };
    const result = ValidationStore._constructValidatorDoc(rules);
    expect(result).to.deep.equal(validatorDoc);
  });

  it('recognizes when validator document cannot be expressed by rules', function() {
    // insert fixture data
    const validatorDoc = {
      'validator': {
        'name': {
          '$regex': '^Tom'
        },
        'city': {
          '$in': ['New York', 'Sydney', 'Berlin', 'Stockholm', 'Philadelphia']
        }
      },
      'validationLevel': 'strict',
      'validationAction': 'error'
    };
    const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
    expect(result.rules).to.be.false;
    expect(result.level).to.be.equal('strict');
    expect(result.action).to.be.equal('error');
  });

  it('updates editState to `modified` when rules are edited', function(done) {
    mockFetchFromServer(null, mockValidatorDoc);

    const spy = sinon.spy();
    unsubscribe = ValidationStore.listen(spy);

    ValidationStore.fetchValidationRules();

    setTimeout(() => {
      const id = ValidationStore.state.validationRules[0].id;
      ValidationStore.setRuleField(id, 'foobar');

      expect(spy.callCount).to.be.equal(3);

      const editState = spy.thirdCall.args[0].editState;
      expect(editState).to.have.equal('modified');
      done();
    }, 10);
  });

  it('updates editState to `unmodified` when rules are changed back to the original rules', function(done) {
    mockFetchFromServer(null, mockValidatorDoc);

    const spy = sinon.spy();
    unsubscribe = ValidationStore.listen(spy);

    ValidationStore.fetchValidationRules();

    setTimeout(() => {
      const id = ValidationStore.state.validationRules[0].id;
      ValidationStore.setRuleField(id, 'foobar');
      ValidationStore.setRuleField(id, 'number');

      expect(spy.callCount).to.be.equal(4);

      const editState = spy.thirdCall.args[0].editState;
      expect(editState).to.have.equal('unmodified');
      done();
    }, 10);
  });

  it('addValidationRule() adds a new empty rule', function(done) {
    mockFetchFromServer(null, mockValidatorDoc);

    const spy = sinon.spy();
    unsubscribe = ValidationStore.listen(spy);

    ValidationStore.fetchValidationRules();

    setTimeout(() => {
      ValidationStore.addValidationRule();
      expect(spy.callCount).to.be.equal(3);
      const rules = spy.thirdCall.args[0].validationRules;
      expect(rules).to.have.lengthOf(3);
      expect(rules[2].id).to.not.be.empty;
      expect(rules[2].field).to.be.empty;
      expect(rules[2].category).to.be.empty;
      expect(rules[2].parameters).to.be.empty;
      expect(rules[2].nullable).to.be.false;
      done();
    }, 10);
  });

  it('deleteValidationRule() removes a rule', function(done) {
    mockFetchFromServer(null, mockValidatorDoc);

    const spy = sinon.spy();
    unsubscribe = ValidationStore.listen(spy);

    ValidationStore.fetchValidationRules();

    setTimeout(() => {
      const id = ValidationStore.state.validationRules[0].id;
      ValidationStore.deleteValidationRule(id);

      expect(spy.callCount).to.be.equal(3);

      const rules = spy.thirdCall.args[0].validationRules;
      expect(rules).to.have.lengthOf(1);
      expect(rules[0].id).to.not.be.empty;
      expect(rules[0].field).to.be.equal('last_name');
      expect(rules[0].category).to.be.equal('regex');
      expect(rules[0].nullable).to.be.false;
      done();
    }, 10);
  });

  it('setRuleField() changes the field of a rule', function(done) {
    mockFetchFromServer(null, mockValidatorDoc);

    const spy = sinon.spy();
    unsubscribe = ValidationStore.listen(spy);

    ValidationStore.fetchValidationRules();

    setTimeout(() => {
      const id = ValidationStore.state.validationRules[0].id;
      ValidationStore.setRuleField(id, 'foobar');

      expect(spy.callCount).to.be.equal(3);

      const rules = spy.thirdCall.args[0].validationRules;
      expect(rules).to.have.lengthOf(2);
      expect(rules[0].id).to.not.be.empty;
      expect(rules[0].field).to.be.equal('foobar');
      done();
    }, 10);
  });

  it('setRuleCategory() changes the category of a rule', function(done) {
    mockFetchFromServer(null, mockValidatorDoc);

    const spy = sinon.spy();
    unsubscribe = ValidationStore.listen(spy);

    ValidationStore.fetchValidationRules();

    setTimeout(() => {
      const id = ValidationStore.state.validationRules[0].id;
      ValidationStore.setRuleCategory(id, 'regex');

      expect(spy.callCount).to.be.equal(3);

      const rules = spy.thirdCall.args[0].validationRules;
      expect(rules).to.have.lengthOf(2);
      expect(rules[0].id).to.not.be.empty;
      expect(rules[0].category).to.be.equal('regex');
      done();
    }, 10);
  });

  it('setRuleCategory() does not allow unknown categories', function(done) {
    mockFetchFromServer(null, mockValidatorDoc);

    const spy = sinon.spy();
    unsubscribe = ValidationStore.listen(spy);

    ValidationStore.fetchValidationRules();

    setTimeout(() => {
      const id = ValidationStore.state.validationRules[0].id;
      ValidationStore.setRuleCategory(id, 'unknown_category');

      expect(spy.callCount).to.be.equal(2);

      const rules = ValidationStore.state.validationRules;
      expect(rules).to.have.lengthOf(2);
      expect(rules[0].id).to.not.be.empty;
      expect(rules[0].category).to.be.equal('exists');
      done();
    }, 10);
  });

  it('setRuleParameters() changes the parameters of a rule', function(done) {
    mockFetchFromServer(null, mockValidatorDoc);

    const spy = sinon.spy();
    unsubscribe = ValidationStore.listen(spy);

    ValidationStore.fetchValidationRules();

    setTimeout(() => {
      const id = ValidationStore.state.validationRules[0].id;
      ValidationStore.setRuleParameters(id, {foo: 1, bar: 2});

      expect(spy.callCount).to.be.equal(3);

      const rules = spy.thirdCall.args[0].validationRules;
      expect(rules).to.have.lengthOf(2);
      expect(rules[0].parameters).to.be.deep.equal({foo: 1, bar: 2});
      done();
    }, 10);
  });

  it('setRuleNullable() changes the nullable value of a rule', function(done) {
    mockFetchFromServer(null, mockValidatorDoc);
    ValidationStore.fetchValidationRules();

    setTimeout(() => {
      const id = ValidationStore.state.validationRules[0].id;
      expect(ValidationStore.state.validationRules[0].nullable).to.be.false;
      ValidationStore.setRuleNullable(id, true);
      expect(ValidationStore.state.validationRules[0].nullable).to.be.true;

      done();
    }, 10);
  });

  it('setRuleNullable() should not accept strings', function(done) {
    mockFetchFromServer(null, mockValidatorDoc);
    ValidationStore.fetchValidationRules();

    setTimeout(() => {
      const id = ValidationStore.state.validationRules[0].id;
      expect(ValidationStore.state.validationRules[0].nullable).to.be.false;
      ValidationStore.setRuleNullable(id, 'I am an illegal string');
      expect(ValidationStore.state.validationRules[0].nullable).to.be.false;

      done();
    }, 10);
  });

  it('setRuleNullable() should always be called with an id and value', function(done) {
    mockFetchFromServer(null, mockValidatorDoc);
    ValidationStore.fetchValidationRules();

    setTimeout(() => {
      expect(ValidationStore.state.validationRules[0].nullable).to.be.false;
      ValidationStore.setRuleNullable(undefined, true);
      expect(ValidationStore.state.validationRules[0].nullable).to.be.false;

      done();
    }, 10);
  });

  it('setValidationLevel() changes the validation level', function(done) {
    mockFetchFromServer(null, mockValidatorDoc);

    const spy = sinon.spy();
    unsubscribe = ValidationStore.listen(spy);

    ValidationStore.fetchValidationRules();

    setTimeout(() => {
      ValidationStore.setValidationLevel('moderate');

      expect(spy.callCount).to.be.equal(3);

      const level = spy.thirdCall.args[0].validationLevel;
      expect(level).to.be.equal('moderate');
      done();
    }, 10);
  });

  it('setValidationLevel() does not allow unknown values', function(done) {
    mockFetchFromServer(null, mockValidatorDoc);

    const spy = sinon.spy();
    unsubscribe = ValidationStore.listen(spy);

    ValidationStore.fetchValidationRules();

    setTimeout(() => {
      ValidationStore.setValidationLevel('unknown_level');

      // expect(spy.callCount).to.be.equal(2);

      const level = ValidationStore.state.validationLevel;
      expect(level).to.be.equal('strict');
      done();
    }, 10);
  });

  it('setValidationAction() changes the validation action', function(done) {
    mockFetchFromServer(null, mockValidatorDoc);

    const spy = sinon.spy();
    unsubscribe = ValidationStore.listen(spy);

    ValidationStore.fetchValidationRules();

    setTimeout(() => {
      ValidationStore.setValidationAction('warn');

      expect(spy.callCount).to.be.equal(3);

      const action = spy.thirdCall.args[0].validationAction;
      expect(action).to.be.equal('warn');
      done();
    }, 10);
  });


  it('setValidationAction() does not allow unknown values', function(done) {
    mockFetchFromServer(null, mockValidatorDoc);

    const spy = sinon.spy();
    unsubscribe = ValidationStore.listen(spy);

    ValidationStore.fetchValidationRules();

    setTimeout(() => {
      ValidationStore.setValidationLevel('unknown_action');

      // expect(spy.callCount).to.be.equal(2);

      const action = ValidationStore.state.validationAction;
      expect(action).to.be.equal('error');
      done();
    }, 10);
  });

  it('viewMode() changes the view mode', function(done) {
    const spy = sinon.spy();
    unsubscribe = ValidationStore.listen(spy);
    ValidationStore.switchView('JSON');

    setTimeout(() => {
      expect(spy.callCount).to.be.equal(1);
      const viewMode = spy.firstCall.args[0].viewMode;
      expect(viewMode).to.be.equal('JSON');
      done();
    }, 10);
  });


  it('viewMode() does not allow unknown values', function(done) {
    const spy = sinon.spy();
    unsubscribe = ValidationStore.listen(spy);
    ValidationStore.switchView('unknown_view_mode');

    setTimeout(() => {
      expect(spy.callCount).to.be.equal(0);
      const viewMode = ValidationStore.state.viewMode;
      expect(viewMode).to.be.equal('Rule Builder');
      done();
    }, 10);
  });

  describe('Range Rule when passing in values that are valid on the server', function() {
    context.skip('values accepted by the rule builder UI', function() {
      it('accepts {$gte: 21}', function() {
        const validatorDoc = {
          'validator': {
            'age': {
              '$gte': 21
            }
          },
          'validationLevel': 'strict',
          'validationAction': 'error'
        };
        const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
        const rule = result.rules[0];
        expect(_.omit(rule, 'id')).to.be.deep.equal({
          category: 'range',
          field: 'age',
          nullable: false,
          parameters: {
            'lowerBoundType': '$gte',
            'lowerBoundValue': 21,
            'upperBoundType': null,
            'upperBoundValue': null
          }
        });
      });

      it('accepts {$lt: 21.1234567890}', function() {
        const validatorDoc = {
          'validator': {
            'age': {
              '$lt': 21.1234567890
            }
          },
          'validationLevel': 'strict',
          'validationAction': 'error'
        };
        const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
        const rule = _.omit(result.rules[0], 'id');
        expect(rule).to.be.deep.equal({
          category: 'range',
          field: 'age',
          nullable: false,
          parameters: {
            'lowerBoundType': null,
            'lowerBoundValue': null,
            'upperBoundType': '$lt',
            'upperBoundValue': 21.123456789
          }
        });
      });

      it('accepts {$gt: 20, $lte: 21}', function() {
        const validatorDoc = {
          'validator': {
            'age': {
              '$gt': 20,
              '$lte': 21
            }
          },
          'validationLevel': 'strict',
          'validationAction': 'error'
        };
        const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
        const rule = _.omit(result.rules[0], 'id');
        expect(rule).to.be.deep.equal({
          category: 'range',
          field: 'age',
          nullable: false,
          parameters: {
            'lowerBoundType': '$gt',
            'lowerBoundValue': 20,
            'upperBoundType': '$lte',
            'upperBoundValue': 21
          }
        });
      });

      it('accepts {$gt: -20, $lte: -0.000001}', function() {
        const validatorDoc = {
          'validator': {
            'age': {
              '$gt': -20,
              '$lte': -0.000001
            }
          },
          'validationLevel': 'strict',
          'validationAction': 'error'
        };
        const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
        const rule = _.omit(result.rules[0], 'id');
        expect(rule).to.be.deep.equal({
          category: 'range',
          field: 'age',
          nullable: false,
          parameters: {
            'lowerBoundType': '$gt',
            'lowerBoundValue': -20,
            'upperBoundType': '$lte',
            'upperBoundValue': -0.000001
          }
        });
      });
    });

    // Note: Server allows these cases, but we'd drop back to JSON view here
    context('values rejected by the rule builder UI', function() {
      // Only documents with value = 5 could be inserted,
      // which being a constant probably should be at the application layer
      it('rejects equality constant range "5 <= value <= 5"', function() {
        const validatorDoc = {
          'validator': {
            'age': {
              '$gte': 5,
              '$lte': 5
            }
          },
          'validationLevel': 'strict',
          'validationAction': 'error'
        };
        const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
        expect(result.rules).to.be.false;
      });

      // Bad as users couldn't insert any documents into the collection
      it('rejects empty range "5 < value <= 5"', function() {
        const validatorDoc = {
          'validator': {
            'age': {
              '$gt': 5,
              '$lte': 5
            }
          },
          'validationLevel': 'strict',
          'validationAction': 'error'
        };
        const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
        expect(result.rules).to.be.false;
      });

      // Bad as users couldn't insert any documents into the collection
      it('rejects empty range "5 <= value < 5"', function() {
        const validatorDoc = {
          'validator': {
            'age': {
              '$gte': 5,
              '$lt': 5
            }
          },
          'validationLevel': 'strict',
          'validationAction': 'error'
        };
        const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
        expect(result.rules).to.be.false;
      });

      // Bad as users couldn't insert any documents into the collection
      it('rejects empty range "6 < value < 5"', function() {
        const validatorDoc = {
          'validator': {
            'age': {
              '$gt': 6,
              '$lt': 5
            }
          },
          'validationLevel': 'strict',
          'validationAction': 'error'
        };
        const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
        expect(result.rules).to.be.false;
      });

      // Better represented in GUI with the "None" operator drop down value
      it('rejects {$gte: -Infinity}', function() {
        const validatorDoc = {
          'validator': {
            'age': {
              '$gte': -Infinity
            }
          },
          'validationLevel': 'strict',
          'validationAction': 'error'
        };
        const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
        expect(result.rules).to.be.false;
      });

      it('rejects {$lt: Infinity}', function() {
        const validatorDoc = {
          'validator': {
            'age': {
              '$lt': Infinity
            }
          },
          'validationLevel': 'strict',
          'validationAction': 'error'
        };
        const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
        expect(result.rules).to.be.false;
      });

      // https://github.com/mongodb/js-bson/blob/0.5/lib/bson/decimal128.js#L6
      it("rejects {$gte: 'inf'}", function() {
        const validatorDoc = {
          'validator': {
            'age': {
              '$gte': 'inf'
            }
          },
          'validationLevel': 'strict',
          'validationAction': 'error'
        };
        const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
        expect(result.rules).to.be.false;
      });

      // Otherwise we'd silently type-convert which does not feel intuitive
      it("rejects a number-string {$gte: '-2.01'}", function() {
        const validatorDoc = {
          'validator': {
            'age': {
              '$gte': '-2.01'
            }
          },
          'validationLevel': 'strict',
          'validationAction': 'error'
        };
        const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
        expect(result.rules).to.be.false;
      });

      // This actually works in that the server allows the validation rule
      // {key: {$gte: NaN}}, but it's not very useful in that you
      // can only insert NaN, so drop back to JSON
      it('rejects NaN {$gte: NaN}', function() {
        const validatorDoc = {
          'validator': {
            'age': {
              '$gte': NaN
            }
          },
          'validationLevel': 'strict',
          'validationAction': 'error'
        };
        const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
        expect(result.rules).to.be.false;
      });

      it('rejects NaN {$lt: NaN}', function() {
        const validatorDoc = {
          'validator': {
            'age': {
              '$lt': NaN
            }
          },
          'validationLevel': 'strict',
          'validationAction': 'error'
        };
        const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
        expect(result.rules).to.be.false;
      });

      it('rejects similar operators {$gt: 20, $gte: 21} are not useful', function() {
        const validatorDoc = {
          'validator': {
            'age': {
              '$gt': 20,
              '$gte': 21
            }
          },
          'validationLevel': 'strict',
          'validationAction': 'error'
        };
        const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
        expect(result.rules).to.be.false;
      });

      it('rejects similar operators {$lt: 20, $lte: 21} are not useful', function() {
        const validatorDoc = {
          'validator': {
            'age': {
              '$lt': 20,
              '$lte': 21
            }
          },
          'validationLevel': 'strict',
          'validationAction': 'error'
        };
        const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
        expect(result.rules).to.be.false;
      });

      // These might be useful, but we'd need to figure out things like
      // the minimum string, maximum string, and
      // understand l10n, i18n and collation properly
      it('rejects strings {$gte: "a", $lte: "z"} are not useful', function() {
        const validatorDoc = {
          'validator': {
            'age': {
              '$lte': 'a',
              '$gte': 'z'
            }
          },
          'validationLevel': 'strict',
          'validationAction': 'error'
        };
        const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
        expect(result.rules).to.be.false;
      });

      it('rejects a document {$lt: {}}', function() {
        const validatorDoc = {
          'validator': {
            'age': {
              '$lt': '{}'
            }
          },
          'validationLevel': 'strict',
          'validationAction': 'error'
        };
        const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
        expect(result.rules).to.be.false;
      });

      it('rejects an array {$lt: []}', function() {
        const validatorDoc = {
          'validator': {
            'age': {
              '$lt': '[]'
            }
          },
          'validationLevel': 'strict',
          'validationAction': 'error'
        };
        const result = ValidationStore._deconstructValidatorDoc(validatorDoc);
        expect(result.rules).to.be.false;
      });
    });
  });
});
