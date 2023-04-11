import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import Aggregations from '../aggregations';
import configureStore from '../../../test/configure-store';
import styles from './aggregations.module.less';
import { Provider } from 'react-redux';

describe('Aggregations [Component]', function () {
  let component;

  beforeEach(function () {
    component = mount(
      <Provider store={configureStore()}>
        <Aggregations
          showExportButton={true}
          showRunButton={true}
          showExplainButton={true}
        />
      </Provider>
    );
  });

  afterEach(function () {
    component.unmount();
    component = null;
  });

  it('renders the correct root classname', function () {
    expect(component.find(`.${styles.aggregations}`)).to.be.present();
  });
});
