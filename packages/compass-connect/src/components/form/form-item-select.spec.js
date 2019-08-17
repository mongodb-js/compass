import React from 'react';
import { mount } from 'enzyme';
import FormItemSelect from './form-item-select';

import styles from '../connect.less';

describe('FormItemSelect [Component]', () => {
  const spy = sinon.spy();
  const changeHandler = (evt) => spy(evt.target.value);

  context('when static data', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <FormItemSelect
          label="Test"
          name="testing"
          changeHandler={changeHandler}
          options={[{'mongodb': 'MongoDB'}]} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the wrapper div', () => {
      const style = `.${styles['form-item']}`;

      expect(component.find(style)).to.be.present();
    });

    it('renders the label', () => {
      const style = `.${styles['form-item']} label span`;

      expect(component.find(style).text()).to.equal('Test');
    });

    it('renders the selection name', () => {
      const style = `.${styles['form-control']}`;

      expect(component.find(style).prop('name')).to.equal('testing');
    });

    it('renders the select options', () => {
      const style = `.${styles['form-control']} option`;

      expect(component.find(style).text()).to.equal('MongoDB');
    });
  });

  context('when selecting an option', () => {
    const component = mount(
      <FormItemSelect
        label="Test"
        name="testing"
        changeHandler={changeHandler}
        options={[{'mongodb': 'MongoDB'}]} />
    );

    before(() => {
      component.find('select').simulate('change');
    });

    it('calls the provided change handler with the data', () => {
      expect(spy.withArgs('mongodb').calledOnce).to.equal(true);
    });
  });
});
