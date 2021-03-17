import React from 'react';
import { shallow } from 'enzyme';
import FormFileInput from '../../../src/components/form/form-file-input';

import styles from '../../../src/components/connect.less';

describe('FormFileInput [Component]', () => {
  context('when no values are provided', () => {
    const spy = sinon.spy();
    let component;

    beforeEach(() => {
      component = shallow(
        <FormFileInput label="Test" name="testing" changeHandler={spy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the wrapper div', () => {
      expect(component.find(`.${styles['form-item']}`)).to.be.present();
    });

    it('renders the label', () => {
      const label = `.${styles['form-item']} label`;

      expect(component.find(label).text()).to.equal('Test');
    });

    it('renders the label button', () => {
      const button = `.${styles['form-item-file-button']}`;

      expect(component.find(button).text()).to.equal('Select a file...');
    });

    it('renders the file icon', () => {
      expect(component.find('.fa-upload')).to.be.present();
    });
  });
});
