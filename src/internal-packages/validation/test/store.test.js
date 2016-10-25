/* eslint no-unused-expressions: 0 */

const expect = require('chai').expect;
const ValidationStore = require('../lib/stores');
const sinon = require('sinon');

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

  it('goes into {fetchState: "error"} when receiving an invalid validator doc', function(done) {
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

  it('goes into {fetchState: "error"} when the result is not an object', function(done) {
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
});
