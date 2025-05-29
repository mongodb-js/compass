import React from 'react';
import { expect } from 'chai';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { Provider } from 'react-redux';

import { CompassSchemaValidation } from './compass-schema-validation';
import { configureStore } from '../stores/store';

describe('CompassSchemaValidation [Component]', function () {
  let store: ReturnType<typeof configureStore> | null;

  beforeEach(function () {
    store = configureStore({}, {} as any);
    render(
      <Provider store={store}>
        <CompassSchemaValidation />
      </Provider>
    );
  });

  it('renders the correct root', function () {
    expect(screen.getByTestId('compass-schema-validation')).to.be.visible;
  });
});
