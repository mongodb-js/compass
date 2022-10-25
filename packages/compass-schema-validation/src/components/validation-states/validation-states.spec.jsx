import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  Banner,
  EmptyContent,
  WarningSummary,
} from '@mongodb-js/compass-components';

import ValidationStates from '../validation-states';
import ValidationEditor from '../validation-editor';

import styles from './validation-states.module.less';

describe('ValidationStates [Component]', function () {
  let props;
  let component;

  beforeEach(function () {
    props = {
      changeZeroState: sinon.spy(),
      zeroStateChanged: sinon.spy(),
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
        error: null,
      },

      /*
      // These all get set by each context() below
      editMode,
      isZeroState,
      isLoaded,
      serverVersion
      */
    };
  });

  context('when the server version is below 3.2', function () {
    beforeEach(function () {
      props.editMode = {
        collectionReadOnly: false,
        preferencesReadonly: false,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: true,
      };

      props.isZeroState = true;
      props.isLoaded = false;
      props.serverVersion = '3.1.0';

      component = mount(<ValidationStates {...props} />);
    });

    it('renders the wrapper div', function () {
      expect(component.find(`.${styles['validation-states']}`)).to.be.present();
    });

    it('renders the version banner', function () {
      expect(
        component.find({ ['data-testid']: 'old-server-read-only' })
      ).to.be.present();
    });

    it('does not render other banners', function () {
      expect(
        component.find({
          ['data-testid']: 'collection-validation-warning',
        })
      ).to.not.be.present();
    });
  });

  context('when the collection is time-series', function () {
    beforeEach(function () {
      props.editMode = {
        collectionTimeSeries: true,
        collectionReadOnly: false,
        preferencesReadonly: false,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: false,
      };
      props.isZeroState = true;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props} />);
    });

    it('renders the collection time-series banner', function () {
      expect(
        component.find({
          ['data-testid']: 'collection-validation-warning',
        })
      ).to.be.present();
      expect(
        component
          .find({
            ['data-testid']: 'collection-validation-warning',
          })
          .at(0)
          .text()
      ).to.equal(
        'Schema validation for time-series collections is not supported.'
      );
    });
  });

  context('when the collection is read-only', function () {
    beforeEach(function () {
      props.editMode = {
        collectionReadOnly: true,
        preferencesReadonly: false,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: false,
      };
      props.isZeroState = true;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props} />);
    });

    it('renders the collection read-only banner', function () {
      expect(
        component.find({
          ['data-testid']: 'collection-validation-warning',
        })
      ).to.be.present();
      expect(
        component
          .find({
            ['data-testid']: 'collection-validation-warning',
          })
          .at(0)
          .text()
      ).to.equal('Schema validation for readonly views is not supported.');
    });

    it('does not render other banners', function () {
      expect(
        component.find({ ['data-testid']: 'old-server-read-only' })
      ).to.be.not.present();
    });
  });

  context('when the server version is higher than 3.2', function () {
    beforeEach(function () {
      props.editMode = {
        collectionReadOnly: false,
        preferencesReadonly: false,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: false,
      };
      props.isZeroState = true;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props} />);
    });

    it('does not render a warning banner', function () {
      expect(component.find(Banner)).to.be.not.present();
      expect(component.find(WarningSummary)).to.be.not.present();
    });
  });

  context('when compass is in the read-only mode', function () {
    beforeEach(function () {
      props.editMode = {
        collectionReadOnly: false,
        preferencesReadonly: true,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: false,
      };
      props.isZeroState = false;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props} />);
    });

    it('does not render a warning banner', function () {
      expect(component.find(Banner)).to.be.not.present();
      expect(component.find(WarningSummary)).to.be.not.present();
    });
  });

  context('when compass is not writable', function () {
    beforeEach(function () {
      props.editMode = {
        collectionReadOnly: false,
        preferencesReadonly: false,
        writeStateStoreReadOnly: true,
        oldServerReadOnly: false,
      };
      props.isZeroState = false;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props} />);
    });

    it('renders the writable banner', function () {
      expect(
        component.find({
          ['data-testid']: 'collection-validation-warning',
        })
      ).to.be.present();
      expect(
        component
          .find({
            ['data-testid']: 'collection-validation-warning',
          })
          .at(0)
          .text()
      ).to.equal('This action is not available on a secondary node.');
    });

    it('does not render other banners', function () {
      expect(
        component.find({ ['data-testid']: 'old-server-read-only' })
      ).to.be.not.present();
    });
  });

  context('when it is in the zero state and not loaded', function () {
    beforeEach(function () {
      props.editMode = {
        collectionReadOnly: false,
        preferencesReadonly: false,
        writeStateStoreReadOnly: true,
        oldServerReadOnly: false,
      };
      props.isZeroState = false;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props} />);
    });

    it('does not render the zero state', function () {
      expect(component.find(EmptyContent)).to.not.be.present();
    });
  });

  context('when it is in the zero state and loaded', function () {
    beforeEach(function () {
      props.editMode = {
        collectionReadOnly: false,
        preferencesReadonly: false,
        writeStateStoreReadOnly: true,
        oldServerReadOnly: false,
      };
      props.isZeroState = true;
      props.isLoaded = true;
      props.serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props} />);
    });

    it('renders the zero state', function () {
      expect(component.find(EmptyContent)).to.be.present();
    });
  });

  context('when it is not in the zero state and not loaded', function () {
    beforeEach(function () {
      props.editMode = {
        collectionReadOnly: false,
        preferencesReadonly: false,
        writeStateStoreReadOnly: true,
        oldServerReadOnly: false,
      };
      props.isZeroState = false;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props} />);
    });

    it('does not render the content', function () {
      expect(component.find(ValidationEditor)).to.not.be.present();
    });
  });

  context('when it is not in the zero state and loaded', function () {
    beforeEach(function () {
      props.editMode = {
        collectionReadOnly: false,
        preferencesReadonly: false,
        writeStateStoreReadOnly: true,
        oldServerReadOnly: false,
      };
      props.isZeroState = false;
      props.isLoaded = true;
      props.serverVersion = '3.2.0';

      component = mount(<ValidationStates {...props} />);
    });

    it('renders the content', function () {
      expect(component.find(ValidationEditor)).to.be.present();
    });
  });
});
