import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import ExplainStage from '../explain-stage';
import styles from './explain-stage.module.less';

describe('ExplainStage [Component]', function() {
  let component;
  const name = '';
  const nReturned = 1;
  const highlights = {};
  const curStageExecTimeMS = 2;
  const prevStageExecTimeMS = 1;
  const totalExecTimeMS = 3;
  const isShard = false;
  const details = {};
  const x = 0;
  const y = 0;
  const xoffset = 0;
  const yoffset = 0;

  beforeEach(function() {
    component = mount(
      <ExplainStage
        name={name}
        nReturned={nReturned}
        highlights={highlights}
        curStageExecTimeMS={curStageExecTimeMS}
        prevStageExecTimeMS={prevStageExecTimeMS}
        totalExecTimeMS={totalExecTimeMS}
        isShard={isShard}
        details={details}
        x={x}
        y={y}
        xoffset={xoffset}
        yoffset={yoffset} />
    );
  });

  afterEach(function() {
    component = null;
  });

  it('renders the correct root classname', function() {
    expect(component.find(`.${styles['explain-stage']}`)).to.be.present();
  });
});
