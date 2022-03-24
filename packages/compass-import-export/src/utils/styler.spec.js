import createStyler from './styler.js';
import { expect } from 'chai';

describe('styler', function () {
  const styles = {
    test: 'test_component_shorthash',
    'test-subcomponent': 'test_component_subcomponent_shorthash',
  };
  const style = createStyler(styles, 'test');
  it('should return the base class name', function () {
    expect(style()).to.be.equal('test_component_shorthash');
  });
  it('should return subcomponent class name', function () {
    expect(style('subcomponent')).to.be.equal(
      'test_component_subcomponent_shorthash'
    );
  });
  it.skip('should throw an error for class name typos', function () {
    style('subcomponnt').to.throw(TypeError);
  });
});
