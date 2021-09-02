import React from 'react';
import { mount } from 'enzyme';
import ValidationStates from '../validation-states';
import styles from './validation-states.less';

import { ZeroState } from 'hadron-react-components';
import ValidationEditor from '../validation-editor';

describe('ValidationStates [Component]', () => {
  let props;
  let component;

  beforeEach(() => {
    props = {
      changeZeroState: sinon.spy(),
      zeroStateChanged: sinon.spy(),
      openLink: sinon.spy(),
      validatorChanged: sinon.spy(),
      validationActionChanged: sinon.spy(),
      validationLevelChanged: sinon.spy(),
      cancelValidation: sinon.spy(),
      saveValidation: sinon.spy(),
      fetchSampleDocuments: sinon.spy(),
      fields: [],
      sampleDocuments: {},
      validation: {
        validator: '',
        validationAction: 'warn',
        validationLevel: 'moderate',
        isChanged: false,
        syntaxError: null,
        error: null
      }

      /*
      // These all get set by each context() below
      editMode,
      isZeroState,
      isLoaded,
      serverVersion
      */
    };
  });

  context('when the server version is below 3.2', () => {
    beforeEach(() => {
      props.editMode = {
        collectionReadOnly: false,
        hadronReadOnly: false,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: true
      };

      props.isZeroState = true;
      props.isLoaded = false;
      props.serverVersion = '3.1.0';

      component = mount(<ValidationStates {...props} />);
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
      props.editMode = {
        collectionTimeSeries: true,
        collectionReadOnly: false,
        hadronReadOnly: false,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: false
      };
      props.isZeroState = true;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props} />);
    });

    it('renders the collection time-series banner', () => {
      expect(component.find({ id: 'collectionTimeSeries' })).to.be.present();
    });
  });

  context('when the collection is read-only', () => {
    beforeEach(() => {
      props.editMode = {
        collectionReadOnly: true,
        hadronReadOnly: false,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: false
      };
      props.isZeroState = true;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props} />);
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
      props.editMode = {
        collectionReadOnly: false,
        hadronReadOnly: false,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: false
      };
      props.isZeroState = true;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props} />);
    });

    it('does not render a warning banner', () => {
      expect(component.find('StatusRow')).to.be.not.present();
    });
  });

  context('when compass is in the read-only mode', () => {
    beforeEach(() => {
      props.editMode = {
        collectionReadOnly: false,
        hadronReadOnly: true,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: false
      };
      props.isZeroState = false;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props} />);
    });

    it('does not render a warning banner', () => {
      expect(component.find('StatusRow')).to.be.not.present();
    });
  });

  context('when compass is not writable', () => {
    beforeEach(() => {
      props.editMode = {
        collectionReadOnly: false,
        hadronReadOnly: false,
        writeStateStoreReadOnly: true,
        oldServerReadOnly: false
      };
      props.isZeroState = false;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props} />);
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
      props.editMode = {
        collectionReadOnly: false,
        hadronReadOnly: false,
        writeStateStoreReadOnly: true,
        oldServerReadOnly: false
      };
      props.isZeroState = false;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props} />);
    });

    it('does not render the zero state', () => {
      expect(component.find(ZeroState)).to.not.be.present();
    });
  });

  context('when it is in the zero state and loaded', () => {
    beforeEach(() => {
      props.editMode = {
        collectionReadOnly: false,
        hadronReadOnly: false,
        writeStateStoreReadOnly: true,
        oldServerReadOnly: false
      };
      props.isZeroState = true;
      props.isLoaded = true;
      props.serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props} />);
    });

    it('renders the zero state', () => {
      expect(component.find(ZeroState)).to.be.present();
    });
  });

  context('when it is not in the zero state and not loaded', () => {
    beforeEach(() => {
      props.editMode = {
        collectionReadOnly: false,
        hadronReadOnly: false,
        writeStateStoreReadOnly: true,
        oldServerReadOnly: false
      };
      props.isZeroState = false;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props} />);
    });

    it('does not render the content', () => {
      expect(component.find(ValidationEditor)).to.not.be.present();
    });
  });

  context('when it is not in the zero state and loaded', () => {
    beforeEach(() => {
      props.editMode = {
        collectionReadOnly: false,
        hadronReadOnly: false,
        writeStateStoreReadOnly: true,
        oldServerReadOnly: false
      };
      props.isZeroState = false;
      props.isLoaded = true;
      props.serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props} />);
    });

    it('renders the content', () => {
      expect(component.find(ValidationEditor)).to.be.present();
    });
  });
});
