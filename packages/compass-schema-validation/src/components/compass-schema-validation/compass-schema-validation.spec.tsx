import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import CompassSchemaValidation from '.';
import { createBareStore } from '../../stores/store';
import { Provider } from 'react-redux';

describe('CompassSchemaValidation [Component]', function () {
  let component: any;
  let store: ReturnType<typeof createBareStore> | null;

  beforeEach(function () {
    store = createBareStore();
    component = mount(
      <Provider store={store}>
        <CompassSchemaValidation />
      </Provider>
    );
  });

  afterEach(function () {
    store = null;
    component = null;
  });

  it('renders the correct root classname', function () {
    expect(component.find(`[data-testid="compass-schema-validation"]`)).to
      .exist;
  });
});
