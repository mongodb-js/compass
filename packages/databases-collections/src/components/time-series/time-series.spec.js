import React from 'react';
import { mount } from 'enzyme';

import TimeSeries from '../time-series';
import styles from './time-series.less';

describe('TimeSeries [Component]', () => {
  let component;
  let changeTimeSeriesOptionSpy;

  beforeEach(() => {
    changeTimeSeriesOptionSpy = sinon.spy();
    component = mount(
      <TimeSeries changeTimeSeriesOption={changeTimeSeriesOptionSpy} />
    );
  });

  afterEach(() => {
    changeTimeSeriesOptionSpy = null;
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles['time-series']}`)).to.be.present();
  });
});
