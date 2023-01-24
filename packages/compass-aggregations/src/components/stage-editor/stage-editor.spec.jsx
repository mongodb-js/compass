import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import { StageEditor } from './stage-editor';

describe('StageEditor [Component]', function () {
  let component;
  const spy = sinon.spy();
  const stage = '{ name: "testing" }';
  const stageOperator = '$match';

  beforeEach(function () {
    component = mount(
      <StageEditor
        stageValue={stage}
        stageOperator={stageOperator}
        index={0}
        autocompleteFields={[]}
        serverVersion="3.6.0"
        onChange={spy}
      />
    );
  });

  afterEach(function () {
    component = null;
  });

  it('renders the wrapper div', function () {
    expect(component.find('UnthemedStageEditor')).to.be.present();
  });
});
