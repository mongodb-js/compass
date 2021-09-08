import React from 'react';
import { mount } from 'enzyme';
import ValidationEditor from '../validation-editor';
import AppRegistry from 'hadron-app-registry';
import hadronApp from 'hadron-app';
import styles from './validation-editor.module.less';

describe('ValidationEditor [Component]', () => {
  context('when it is an editable mode', () => {
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
    const isEditable = true;
    const appRegistry = new AppRegistry();

    before(function() {
      global.hadronApp = hadronApp;
      global.hadronApp.appRegistry = appRegistry;
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
          isEditable={isEditable}
          openLink={openLinkSpy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the wrapper div', () => {
      expect(component.find(`.${styles['validation-editor']}`)).to.be.present();
      expect(component.find('ReactAce').props().readOnly).to.be.equal(false);
    });
  });

  context('when it is a not editable mode', () => {
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
    const isEditable = false;
    const appRegistry = new AppRegistry();

    before(function() {
      global.hadronApp = hadronApp;
      global.hadronApp.appRegistry = appRegistry;
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
          isEditable={isEditable}
          openLink={openLinkSpy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the wrapper div', () => {
      expect(component.find('ReactAce').props().readOnly).to.be.equal(true);
    });
  });
});
