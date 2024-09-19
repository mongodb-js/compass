import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import ValidationStates from '.';
import {
  createPluginTestHelpers,
  screen,
} from '@mongodb-js/testing-library-compass';
import { CompassSchemaValidationPlugin } from '../../index';

const { renderWithConnections } = createPluginTestHelpers(
  CompassSchemaValidationPlugin.Provider.withMockServices({
    dataService: {
      collectionInfo() {
        return Promise.resolve({});
      },
    } as any,
    instance: {
      build: {
        version: '7.0.0',
      },
      on() {},
      removeListener() {},
    } as any,
  }),
  {
    namespace: 'foo.bar',
  } as any
);

describe('ValidationStates [Component]', function () {
  let props: any;

  const render = (props: any) => {
    return renderWithConnections(<ValidationStates {...props} />);
  };

  beforeEach(function () {
    props = {
      changeZeroState: sinon.spy(),
      zeroStateChanged: sinon.spy(),
      validatorChanged: sinon.spy(),
      validationActionChanged: sinon.spy(),
      validationLevelChanged: sinon.spy(),
      cancelValidation: sinon.spy(),
      saveValidation: sinon.spy(),
      clearSampleDocuments: sinon.spy(),
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
        collectionTimeSeries: false,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: true,
      };
      props.readOnly = false;
      props.isZeroState = true;
      props.isLoaded = false;
      props.serverVersion = '3.1.0';

      render(props);
    });

    it('renders the wrapper div', function () {
      expect(screen.getByTestId('schema-validation-states')).to.exist;
    });

    it('renders the version banner', function () {
      expect(screen.getByTestId('old-server-read-only')).to.exist;
    });

    it('does not render other banners', function () {
      expect(
        screen.queryByTestId('collection-validation-warning')
      ).to.not.exist;
    });
  });

  context('when the collection is time-series', function () {
    beforeEach(function () {
      props.editMode = {
        collectionTimeSeries: true,
        collectionReadOnly: false,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: false,
      };
      props.readOnly = false;
      props.isZeroState = true;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      render(props);
    });

    it('renders the collection time-series banner', function () {
      expect(
        screen.getByTestId('collection-validation-warning').textContent
      ).to.equal(
        'Schema validation for time-series collections is not supported.'
      );
    });
  });

  context('when the collection is read-only', function () {
    beforeEach(function () {
      props.editMode = {
        collectionReadOnly: true,
        collectionTimeSeries: false,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: false,
      };
      props.readOnly = false;
      props.isZeroState = true;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      render(props);
    });

    it('renders the collection read-only banner', function () {
      expect(
        screen.getByTestId('collection-validation-warning').textContent
      ).to.equal('Schema validation for readonly views is not supported.');
    });

    it('does not render other banners', function () {
      expect(screen.queryByTestId('old-server-read-only')).to.be.not.exist;
    });
  });

  context('when the server version is higher than 3.2', function () {
    beforeEach(function () {
      props.editMode = {
        collectionReadOnly: false,
        collectionTimeSeries: false,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: false,
      };
      props.readOnly = false;
      props.isZeroState = true;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      render(props);
    });

    it('does not render a warning banner', function () {
      expect(
        screen.queryByTestId('collection-validation-warning')
      ).to.be.not.exist;
    });
  });

  context('when compass is in the read-only mode', function () {
    beforeEach(function () {
      props.editMode = {
        collectionReadOnly: false,
        collectionTimeSeries: false,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: false,
      };
      props.readOnly = true;
      props.isZeroState = false;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      render(props);
    });

    it('does not render a warning banner', function () {
      expect(
        screen.queryByTestId('collection-validation-warning')
      ).to.be.not.exist;
    });
  });

  context('when compass is not writable', function () {
    beforeEach(function () {
      props.editMode = {
        collectionReadOnly: false,
        collectionTimeSeries: false,
        writeStateStoreReadOnly: true,
        oldServerReadOnly: false,
      };
      props.readOnly = false;
      props.isZeroState = false;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      render(props);
    });

    it('renders the writable banner', function () {
      expect(
        screen.getByTestId('collection-validation-warning').textContent
      ).to.equal('This action is not available on a secondary node.');
    });

    it('does not render other banners', function () {
      expect(screen.queryByTestId('old-server-read-only')).to.be.not.exist;
    });
  });

  context('when it is in the zero state and not loaded', function () {
    beforeEach(function () {
      props.editMode = {
        collectionReadOnly: false,
        collectionTimeSeries: false,
        writeStateStoreReadOnly: true,
        oldServerReadOnly: false,
      };
      props.readOnly = false;
      props.isZeroState = false;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      render(props);
    });

    it('does not render the zero state', function () {
      expect(screen.queryByTestId('empty-content')).to.not.exist;
    });
  });

  context('when it is in the zero state and loaded', function () {
    beforeEach(function () {
      props.editMode = {
        collectionReadOnly: false,
        collectionTimeSeries: false,
        writeStateStoreReadOnly: true,
        oldServerReadOnly: false,
      };
      props.readOnly = false;
      props.isZeroState = true;
      props.isLoaded = true;
      props.serverVersion = '3.2.0';

      render(props);
    });

    it('renders the zero state', function () {
      expect(screen.getByTestId('empty-content')).to.exist;
    });
  });

  context('when it is not in the zero state and not loaded', function () {
    beforeEach(function () {
      props.editMode = {
        collectionReadOnly: false,
        collectionTimeSeries: false,
        writeStateStoreReadOnly: true,
        oldServerReadOnly: false,
      };
      props.readOnly = false;
      props.isZeroState = false;
      props.isLoaded = false;
      props.serverVersion = '3.2.0';

      render(props);
    });

    it('does not render the content', function () {
      expect(screen.queryByTestId('validation-editor')).to.not.exist;
    });
  });

  context('when it is not in the zero state and loaded', function () {
    beforeEach(function () {
      props.editMode = {
        collectionReadOnly: false,
        collectionTimeSeries: false,
        writeStateStoreReadOnly: true,
        oldServerReadOnly: false,
      };
      props.readOnly = false;
      props.isZeroState = false;
      props.isLoaded = true;
      props.serverVersion = '3.2.0';

      render(props);
    });

    it('renders the content', function () {
      expect(screen.getByTestId('validation-editor')).to.exist;
    });
  });
});
