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

  it('return string value - enabled stage', function() {
    stage.changeValue('{}');
    stage.changeOperator('$match');
    expect(stage.toString()).to.equal(`{\n  $match: {}\n}`);
  });

  it('return string value - disabled stage', function() {
    stage.changeValue('{}');
    stage.changeOperator('$match');
    stage.changeDisabled(true);
    expect(stage.toString()).to.equal(`// {\n//   $match: {}\n// }`);
  });
  
  it('can stringify stage with syntax errors', function() {
    stage.changeOperator('$match');
    stage.changeValue('{ _id: 1');
    expect(stage.toString()).to.equal(`{\n  $match: { _id: 1\n}`);
  })
});