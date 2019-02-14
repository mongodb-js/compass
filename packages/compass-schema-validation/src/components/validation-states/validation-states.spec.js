import React from 'react';
import { mount } from 'enzyme';
import ValidationStates from 'components/validation-states';
import styles from './validation-states.less';

describe('ValidationStates [Component]', () => {
  context('when the server version is below than 3.2', () => {
    let component;
    const changeZeroStateSpy = sinon.spy();
    const setZeroStateChangedSpy = sinon.spy();
    const openLinkSpy = sinon.spy();
    const setValidatorChangedSpy = sinon.spy();
    const setValidationActionChangedSpy = sinon.spy();
    const setValidationLevelChangedSpy = sinon.spy();
    const setCancelValidationSpy = sinon.spy();
    const saveValidationSpy = sinon.spy();
    const fetchSampleDocumentsSpy = sinon.spy();
    const fields = [];
    const validation = {
      validator: '',
      validationAction: 'warn',
      validationLevel: 'moderate',
      isChanged: false,
      syntaxError: null,
      error: null
    };
    const sampleDocuments = {};
    const isEditable = false;
    const isZeroState = true;
    const serverVersion = '3.1.0';

    beforeEach(() => {
      component = mount(
        <ValidationStates
          validatorChanged={setValidatorChangedSpy}
          validationActionChanged={setValidationActionChangedSpy}
          validationLevelChanged={setValidationLevelChangedSpy}
          cancelValidation={setCancelValidationSpy}
          saveValidation={saveValidationSpy}
          fetchSampleDocuments={fetchSampleDocumentsSpy}
          fields={fields}
          validation={validation}
          changeZeroState={changeZeroStateSpy}
          zeroStateChanged={setZeroStateChangedSpy}
          isZeroState={isZeroState}
          isEditable={isEditable}
          serverVersion={serverVersion}
          sampleDocuments={sampleDocuments}
          openLink={openLinkSpy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the wrapper div', () => {
      expect(component.find(`.${styles['validation-states']}`)).to.be.present();
    });

    it('renders the version banner', () => {
      expect(component.find(`.${styles['upgrade-link']}`)).to.be.present();
    });
  });

  context('when the server version is higher than 3.2', () => {
    let component;
    const changeZeroStateSpy = sinon.spy();
    const setZeroStateChangedSpy = sinon.spy();
    const openLinkSpy = sinon.spy();
    const setValidatorChangedSpy = sinon.spy();
    const setValidationActionChangedSpy = sinon.spy();
    const setValidationLevelChangedSpy = sinon.spy();
    const setCancelValidationSpy = sinon.spy();
    const saveValidationSpy = sinon.spy();
    const fetchSampleDocumentsSpy = sinon.spy();
    const fields = [];
    const validation = {
      validator: '',
      validationAction: 'warn',
      validationLevel: 'moderate',
      isChanged: false,
      syntaxError: null,
      error: null
    };
    const sampleDocuments = {};
    const isEditable = false;
    const isZeroState = true;
    const serverVersion = '3.3.0';

    beforeEach(() => {
      component = mount(
        <ValidationStates
          validatorChanged={setValidatorChangedSpy}
          validationActionChanged={setValidationActionChangedSpy}
          validationLevelChanged={setValidationLevelChangedSpy}
          cancelValidation={setCancelValidationSpy}
          saveValidation={saveValidationSpy}
          fetchSampleDocuments={fetchSampleDocumentsSpy}
          fields={fields}
          validation={validation}
          changeZeroState={changeZeroStateSpy}
          zeroStateChanged={setZeroStateChangedSpy}
          isZeroState={isZeroState}
          isEditable={isEditable}
          serverVersion={serverVersion}
          sampleDocuments={sampleDocuments}
          openLink={openLinkSpy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('does not render the version banner', () => {
      expect(component.find(`.${styles['upgrade-link']}`)).to.be.not.present();
    });

    it('renders the read only banner', () => {
      expect(component.find('StatusRow')).to.be.present();
    });
  });
});
