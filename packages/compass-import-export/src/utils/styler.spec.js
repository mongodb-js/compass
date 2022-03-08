import createStyler from './styler.js';

describe('styler', () => {
  const styles = {
    test: 'test_component_shorthash',
    'test-subcomponent': 'test_component_subcomponent_shorthash'
  };
  const style = createStyler(styles, 'test');
  it('should return the base class name', () => {
    expect(style()).to.be.equal('test_component_shorthash');
  });
  it('should return subcomponent class name', ()=> {
    expect(style('subcomponent')).to.be.equal('test_component_subcomponent_shorthash');
  });
  it.skip('should throw an error for class name typos', () => {
    style('subcomponnt').to.throw(TypeError);
  });
});
