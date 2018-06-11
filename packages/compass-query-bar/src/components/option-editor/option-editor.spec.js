import React from 'react';
import { mount } from 'enzyme';
import OptionEditor from 'components/option-editor';
import AppRegistry from 'hadron-app-registry';
import hadronApp from 'hadron-app';
import FieldStore from '@mongodb-js/compass-field-store';
import Actions from 'actions';

describe('OptionEditor [Component]', function() {
  let onChangeSpy;
  let onApplySpy;
  let component;
  const appRegistry = new AppRegistry();

  before(function() {
    global.hadronApp = hadronApp;
    global.hadronApp.appRegistry = appRegistry;
    global.hadronApp.appRegistry.registerStore('Field.Store', FieldStore);
  });

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
          actions={Actions}
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
  });
});
