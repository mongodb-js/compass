import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import AppRegistry from 'hadron-app-registry';
import hadronApp from 'hadron-app';

import ValidationEditor from '../validation-editor';

describe('ValidationEditor [Component]', function () {
  context('when it is an editable mode', function () {
    let component;
    const setValidatorChangedSpy = sinon.spy();
    const setValidationActionChangedSpy = sinon.spy();
    const setValidationLevelChangedSpy = sinon.spy();
    const setCancelValidationSpy = sinon.spy();
    const saveValidationSpy = sinon.spy();
    const clearSampleDocumentsSpy = sinon.spy();
    const serverVersion = '3.6.0';
    const fields = [];
    const validation = {
      validator: '',
      validationAction: 'warn',
      validationLevel: 'moderate',
      isChanged: false,
      syntaxError: null,
      error: null,
    };
    const isEditable = true;
    const appRegistry = new AppRegistry();

    before(function () {
      global.hadronApp = hadronApp;
      global.hadronApp.appRegistry = appRegistry;
    });

    beforeEach(function () {
      component = mount(
        <ValidationEditor
          validatorChanged={setValidatorChangedSpy}
          validationActionChanged={setValidationActionChangedSpy}
          validationLevelChanged={setValidationLevelChangedSpy}
          cancelValidation={setCancelValidationSpy}
          saveValidation={saveValidationSpy}
          clearSampleDocuments={clearSampleDocumentsSpy}
          serverVersion={serverVersion}
          fields={fields}
          validation={validation}
          isEditable={isEditable}
        />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('renders the wrapper div', function () {
      expect(component.find('ValidationEditor')).to.be.present();
      expect(component.find('ReactAce').props().readOnly).to.be.equal(false);
    });
  });

  context('when it is a not editable mode', function () {
    let component;
    const setValidatorChangedSpy = sinon.spy();
    const setValidationActionChangedSpy = sinon.spy();
    const setValidationLevelChangedSpy = sinon.spy();
    const setCancelValidationSpy = sinon.spy();
    const saveValidationSpy = sinon.spy();
    const clearSampleDocumentsSpy = sinon.spy();
    const serverVersion = '3.6.0';
    const fields = [];
    const validation = {
      validator: '',
      validationAction: 'warn',
      validationLevel: 'moderate',
      isChanged: false,
      syntaxError: null,
      error: null,
    };
    const isEditable = false;
    const appRegistry = new AppRegistry();

    before(function () {
      global.hadronApp = hadronApp;
      global.hadronApp.appRegistry = appRegistry;
    });

    beforeEach(function () {
      component = mount(
        <ValidationEditor
          validatorChanged={setValidatorChangedSpy}
          validationActionChanged={setValidationActionChangedSpy}
          validationLevelChanged={setValidationLevelChangedSpy}
          cancelValidation={setCancelValidationSpy}
          saveValidation={saveValidationSpy}
          clearSampleDocuments={clearSampleDocumentsSpy}
          serverVersion={serverVersion}
          fields={fields}
          validation={validation}
          isEditable={isEditable}
        />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('renders the wrapper div', function () {
      expect(component.find('ReactAce').props().readOnly).to.be.equal(true);
    });
  });
});
