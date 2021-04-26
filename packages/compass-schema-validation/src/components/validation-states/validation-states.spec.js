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
    const editMode = {
      collectionReadOnly: false,
      hardonReadOnly: false,
      writeStateStoreReadOnly: false,
      oldServerReadOnly: true
    };
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
          editMode={editMode}
          sampleDocuments={sampleDocuments}
          serverVersion={serverVersion}
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
      expect(component.find({ id: 'oldServerReadOnly' })).to.be.present();
    });

    it('does not render other banners', () => {
      expect(component.find({ id: 'collectionReadOnly' })).to.be.not.present();
      expect(component.find({ id: 'hardonReadOnly' })).to.be.not.present();
      expect(component.find({ id: 'writeStateStoreReadOnly' })).to.be.not.present();
    });
  });

  context('when the collection is read-only', () => {
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
    const editMode = {
      collectionReadOnly: true,
      hardonReadOnly: false,
      writeStateStoreReadOnly: false,
      oldServerReadOnly: false
    };
    const isZeroState = true;
    const serverVersion = '3.2.0';

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
          editMode={editMode}
          sampleDocuments={sampleDocuments}
          serverVersion={serverVersion}
          openLink={openLinkSpy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the collection read-only banner', () => {
      expect(component.find({ id: 'collectionReadOnly' })).to.be.present();
    });

    it('does not render other banners', () => {
      expect(component.find({ id: 'oldServerReadOnly' })).to.be.not.present();
      expect(component.find({ id: 'hardonReadOnly' })).to.be.not.present();
      expect(component.find({ id: 'writeStateStoreReadOnly' })).to.be.not.present();
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
    const editMode = {
      collectionReadOnly: false,
      hardonReadOnly: false,
      writeStateStoreReadOnly: false,
      oldServerReadOnly: false
    };
    const isZeroState = true;
    const serverVersion = '3.2.0';

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
          editMode={editMode}
          sampleDocuments={sampleDocuments}
          serverVersion={serverVersion}
          openLink={openLinkSpy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('does not render a warning banner', () => {
      expect(component.find('StatusRow')).to.be.not.present();
    });
  });

  context('when compass is in the read-only mode', () => {
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
    const editMode = {
      collectionReadOnly: false,
      hardonReadOnly: true,
      writeStateStoreReadOnly: false,
      oldServerReadOnly: false
    };
    const isZeroState = false;
    const serverVersion = '3.2.0';

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
          editMode={editMode}
          sampleDocuments={sampleDocuments}
          serverVersion={serverVersion}
          openLink={openLinkSpy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('does not render a warning banner', () => {
      expect(component.find('StatusRow')).to.be.not.present();
    });
  });

  context('when compass is not writable', () => {
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
    const editMode = {
      collectionReadOnly: false,
      hardonReadOnly: false,
      writeStateStoreReadOnly: true,
      oldServerReadOnly: false
    };
    const isZeroState = false;
    const serverVersion = '3.2.0';

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
          editMode={editMode}
          sampleDocuments={sampleDocuments}
          serverVersion={serverVersion}
          openLink={openLinkSpy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the writable banner', () => {
      expect(component.find({ id: 'writeStateStoreReadOnly' })).to.be.present();
    });

    it('does not render other banners', () => {
      expect(component.find({ id: 'collectionReadOnly' })).to.be.not.present();
      expect(component.find({ id: 'hardonReadOnly' })).to.be.not.present();
      expect(component.find({ id: 'oldServerReadOnly' })).to.be.not.present();
    });
  });
});
