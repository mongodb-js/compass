import React from 'react';
import { mount } from 'enzyme';
import ValidationStates from '../validation-states';
import styles from './validation-states.less';

import { ZeroState } from 'hadron-react-components';
import ValidationEditor from '../validation-editor';

describe('ValidationStates [Component]', () => {
  let component;
  let changeZeroStateSpy;
  let setZeroStateChangedSpy;
  let openLinkSpy;
  let setValidatorChangedSpy;
  let setValidationActionChangedSpy;
  let setValidationLevelChangedSpy;
  let setCancelValidationSpy;
  let saveValidationSpy;
  let fetchSampleDocumentsSpy;
  let fields;
  let validation;
  let sampleDocuments;
  let editMode;
  let isZeroState;
  let isLoaded;
  let serverVersion;

  const props = () => {
    return {
      changeZeroState: changeZeroStateSpy,
      zeroStateChanged: setZeroStateChangedSpy,
      openLink: openLinkSpy,
      validatorChanged: setValidatorChangedSpy,
      validationActionChanged: setValidationActionChangedSpy,
      validationLevelChanged: setValidationLevelChangedSpy,
      cancelValidation: setCancelValidationSpy,
      saveValidation: saveValidationSpy,
      fetchSampleDocuments: fetchSampleDocumentsSpy,
      component,
      fields,
      validation,
      sampleDocuments,
      editMode,
      isZeroState,
      isLoaded,
      serverVersion
    };
  };

  beforeEach(() => {
    changeZeroStateSpy = sinon.spy();
    setZeroStateChangedSpy = sinon.spy();
    openLinkSpy = sinon.spy();
    setValidatorChangedSpy = sinon.spy();
    setValidationActionChangedSpy = sinon.spy();
    setValidationLevelChangedSpy = sinon.spy();
    setCancelValidationSpy = sinon.spy();
    saveValidationSpy = sinon.spy();
    fetchSampleDocumentsSpy = sinon.spy();

    // none of the tests below (at the time of writing) ever set these to anything else
    fields = [];
    sampleDocuments = {};
    validation = {
      validator: '',
      validationAction: 'warn',
      validationLevel: 'moderate',
      isChanged: false,
      syntaxError: null,
      error: null
    };

    // the rest of the props will be set explicitly below for every context()
  });

  context('when the server version is below 3.2', () => {
    beforeEach(() => {
      editMode = {
        collectionReadOnly: false,
        hadronReadOnly: false,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: true
      };

      isZeroState = true;
      isLoaded = false;
      serverVersion = '3.1.0';

      component = mount(<ValidationStates {...props()} />);
    });

    it('renders the wrapper div', () => {
      expect(component.find(`.${styles['validation-states']}`)).to.be.present();
    });

    it('renders the version banner', () => {
      expect(component.find({ id: 'oldServerReadOnly' })).to.be.present();
    });

    it('does not render other banners', () => {
      expect(component.find({ id: 'collectionReadOnly' })).to.be.not.present();
      expect(component.find({ id: 'hadronReadOnly' })).to.be.not.present();
      expect(component.find({ id: 'writeStateStoreReadOnly' })).to.be.not.present();
    });
  });

  context('when the collection is time-series', () => {
    beforeEach(() => {
      editMode = {
        collectionTimeSeries: true,
        collectionReadOnly: false,
        hadronReadOnly: false,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: false
      };
      isZeroState = true;
      isLoaded = false;
      serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props()} />);
    });

    it('renders the collection time-series banner', () => {
      expect(component.find({ id: 'collectionTimeSeries' })).to.be.present();
    });
  });

  context('when the collection is read-only', () => {
    beforeEach(() => {
      editMode = {
        collectionReadOnly: true,
        hadronReadOnly: false,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: false
      };
      isZeroState = true;
      isLoaded = false;
      serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props()} />);
    });

    it('renders the collection read-only banner', () => {
      expect(component.find({ id: 'collectionReadOnly' })).to.be.present();
    });

    it('does not render other banners', () => {
      expect(component.find({ id: 'oldServerReadOnly' })).to.be.not.present();
      expect(component.find({ id: 'hadronReadOnly' })).to.be.not.present();
      expect(component.find({ id: 'writeStateStoreReadOnly' })).to.be.not.present();
    });
  });

  context('when the server version is higher than 3.2', () => {
    beforeEach(() => {
      editMode = {
        collectionReadOnly: false,
        hadronReadOnly: false,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: false
      };
      isZeroState = true;
      isLoaded = false;
      serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props()} />);
    });

    it('does not render a warning banner', () => {
      expect(component.find('StatusRow')).to.be.not.present();
    });
  });

  context('when compass is in the read-only mode', () => {
    beforeEach(() => {
      editMode = {
        collectionReadOnly: false,
        hadronReadOnly: true,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: false
      };
      isZeroState = false;
      isLoaded = false;
      serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props()} />);
    });

    it('does not render a warning banner', () => {
      expect(component.find('StatusRow')).to.be.not.present();
    });
  });

  context('when compass is not writable', () => {
    beforeEach(() => {
      editMode = {
        collectionReadOnly: false,
        hadronReadOnly: false,
        writeStateStoreReadOnly: true,
        oldServerReadOnly: false
      };
      isZeroState = false;
      isLoaded = false;
      serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props()} />);
    });

    it('renders the writable banner', () => {
      expect(component.find({ id: 'writeStateStoreReadOnly' })).to.be.present();
    });

    it('does not render other banners', () => {
      expect(component.find({ id: 'collectionReadOnly' })).to.be.not.present();
      expect(component.find({ id: 'hadronReadOnly' })).to.be.not.present();
      expect(component.find({ id: 'oldServerReadOnly' })).to.be.not.present();
    });
  });

  context('when it is in the zero state and not loaded', () => {
    beforeEach(() => {
      editMode = {
        collectionReadOnly: false,
        hadronReadOnly: false,
        writeStateStoreReadOnly: true,
        oldServerReadOnly: false
      };
      isZeroState = false;
      isLoaded = false;
      serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props()} />);
    });

    it('does not render the zero state', () => {
      expect(component.find(ZeroState)).to.not.be.present();
    });
  });

  context('when it is in the zero state and loaded', () => {
    beforeEach(() => {
      editMode = {
        collectionReadOnly: false,
        hadronReadOnly: false,
        writeStateStoreReadOnly: true,
        oldServerReadOnly: false
      };
      isZeroState = true;
      isLoaded = true;
      serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props()} />);
    });

    it('renders the zero state', () => {
      expect(component.find(ZeroState)).to.be.present();
    });
  });

  context('when it is not in the zero state and not loaded', () => {
    beforeEach(() => {
      editMode = {
        collectionReadOnly: false,
        hadronReadOnly: false,
        writeStateStoreReadOnly: true,
        oldServerReadOnly: false
      };
      isZeroState = false;
      isLoaded = false;
      serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props()} />);
    });

    it('does not render the content', () => {
      expect(component.find(ValidationEditor)).to.not.be.present();
    });
  });

  context('when it is not in the zero state and loaded', () => {
    beforeEach(() => {
      editMode = {
        collectionReadOnly: false,
        hadronReadOnly: false,
        writeStateStoreReadOnly: true,
        oldServerReadOnly: false
      };
      isZeroState = false;
      isLoaded = true;
      serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props()} />);
    });

    it('renders the content', () => {
      expect(component.find(ValidationEditor)).to.be.present();
    });
  });
});
