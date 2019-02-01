import React from 'react';
import { mount } from 'enzyme';
import ValidationEditor from 'components/validation-editor';
import AppRegistry from 'hadron-app-registry';
import hadronApp from 'hadron-app';
import FieldStore from '@mongodb-js/compass-field-store';
import styles from './validation-editor.less';

describe('ValidationEditor [Component]', () => {
  let component;
  const setValidatorChangedSpy = sinon.spy();
  const setValidationActionChangedSpy = sinon.spy();
  const setValidationLevelChangedSpy = sinon.spy();
  const setCancelValidationSpy = sinon.spy();
  const saveValidationSpy = sinon.spy();
  const openLinkSpy = sinon.spy();
  const fetchSampleDocumentsSpy = sinon.spy();
  const serverVersion = '3.6.0';
  const fields = [];
  const validation = {
    validator: '',
    validationAction: 'warn',
    validationLevel: 'moderate',
    isChanged: false,
    syntaxError: null,
    error: null
  };
  const appRegistry = new AppRegistry();

  before(function() {
    global.hadronApp = hadronApp;
    global.hadronApp.appRegistry = appRegistry;
    global.hadronApp.appRegistry.registerStore('Field.Store', FieldStore);
  });

  beforeEach(() => {
    component = mount(
      <ValidationEditor
        validatorChanged={setValidatorChangedSpy}
        validationActionChanged={setValidationActionChangedSpy}
        validationLevelChanged={setValidationLevelChangedSpy}
        cancelValidation={setCancelValidationSpy}
        saveValidation={saveValidationSpy}
        fetchSampleDocuments={fetchSampleDocumentsSpy}
        serverVersion={serverVersion}
        fields={fields}
        validation={validation}
        openLink={openLinkSpy} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['validation-editor']}`)).to.be.present();
  });
});
