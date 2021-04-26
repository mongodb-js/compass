import React from 'react';
import { mount } from 'enzyme';
import OptionEditor from 'components/option-editor';
import configureActions from 'actions';

import styles from './option-editor.less';

describe('OptionEditor [Component]', function() {
  let onChangeSpy;
  let onApplySpy;
  let component;

  beforeEach(function() {
    onChangeSpy = sinon.spy();
    onApplySpy = sinon.spy();
  });

  afterEach(function() {
    onChangeSpy = null;
    onApplySpy = null;
  });

  context('when rendering the component', function() {
    before(function() {
      component = mount(
        <OptionEditor
          label="Apply"
          serverVersion="3.4.0"
          autoPopulated={false}
          actions={configureActions()}
          value="{ name: 'testing' }"
          onChange={onChangeSpy}
          onApply={onApplySpy}
          schemaFields={[]} />
      );
    });

    after(function() {
      component = null;
    });

    it('renders the editor', function() {
      expect(component.find('#query-bar-option-input-Apply')).to.be.present();
    });

    it('has the correct class', function() {
      expect(component.find(`.${styles['option-editor']}`)).to.be.present();
    });
  });
});
