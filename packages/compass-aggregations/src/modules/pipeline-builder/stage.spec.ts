import * as babelParser from '@babel/parser';
import { expect } from 'chai';
import Stage from './stage';

describe('Stage', function () {
  let stage: Stage;

  beforeEach(function() {
    const ast = babelParser.parseExpression(`{}`);
    stage = new Stage(ast);
    expect(stage.operator).to.equal(null);
    expect(stage.value).to.equal(null);
    expect(stage.disabled).to.equal(false);
  });

  it('changes stage operator', function() {
    stage.changeOperator('$match');
    expect(stage.operator).to.equal('$match');
    expect(stage.value).to.equal(null);
    expect(stage.disabled).to.equal(false);
  });

  it('changes stage value', function() {
    stage.changeValue('{}');
    expect(stage.operator).to.equal(null);
    expect(stage.value).to.equal('{}');
    expect(stage.disabled).to.equal(false);
  });

  it('changes stage disabled', function() {
    stage.changeDisabled(true);
    expect(stage.operator).to.equal(null);
    expect(stage.value).to.equal(null);
    expect(stage.disabled).to.equal(true);
  });

  describe('toString', function () {
    it('return string value - enabled stage', function () {
      stage.changeValue('{}');
      stage.changeOperator('$match');
      expect(stage.toString()).to.equal(`{\n  $match: {}\n}`);
    });

    it('return string value - disabled stage', function () {
      stage.changeValue('{}');
      stage.changeOperator('$match');
      stage.changeDisabled(true);
      expect(stage.toString()).to.equal(`// {\n//   $match: {}\n// }`);
    });

    it('can stringify stage with syntax errors', function () {
      stage.changeOperator('$match');
      stage.changeValue('{ _id: 1');
      expect(stage.toString()).to.equal(`{\n  $match: { _id: 1\n}`);
    });

    it('can stringify stage without any properties', function () {
      const stage = new Stage();
      expect(stage.toString()).to.equal('{}');
    });
  });

  it('attaches trailing comments to the value', function () {
    const ast = babelParser.parseExpression(
      `{ $match: { _id: 1 } /* trailing comment */ }`
    );
    const stage = new Stage(ast);

    expect(stage.value).to.eq(`{
  _id: 1,
} /* trailing comment */`);

    stage.changeValue(`{
  _id: 1,
} /* new comment */`);

    expect(stage.toString()).to.eq(`{
  $match: {
    _id: 1,
  } /* new comment */,
}`);
  });

  describe('isEmpty', function () {
    it("returns true when stage doesn't have value and operator", function () {
      const ast = babelParser.parseExpression(`{}`);
      stage = new Stage(ast);
      expect(stage).to.have.property('isEmpty', true);
    });

    it('returns false when stage has operator', function () {
      const ast = babelParser.parseExpression(`{}`);
      stage = new Stage(ast);
      stage.changeOperator('$match');
      expect(stage).to.have.property('isEmpty', false);
    });

    it('returns false when stage has invalid operator', function () {
      const ast = babelParser.parseExpression(`{}`);
      stage = new Stage(ast);
      stage.changeOperator('not_a_real_stage');
      expect(stage).to.have.property('isEmpty', false);
    });

    it('returns false when stage has value', function () {
      const ast = babelParser.parseExpression(`{}`);
      stage = new Stage(ast);
      stage.changeValue('{ _id: 1 }');
      expect(stage).to.have.property('isEmpty', false);
    });

    it('returns false when stage is not an object', function () {
      const ast = babelParser.parseExpression(`42`);
      stage = new Stage(ast);
      expect(stage).to.have.property('isEmpty', false);
    });
  });
});