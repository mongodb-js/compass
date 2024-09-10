import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import { StageEditor } from './stage-editor';

describe('StageEditor [Component]', function () {
  let component: ReturnType<typeof mount> | null;
  const spy = sinon.spy();
  const stage = '{ name: "testing" }';
  const stageOperator = '$match';

  beforeEach(function () {
    component = mount(
      <StageEditor
        namespace="test.test"
        stageValue={stage}
        stageOperator={stageOperator}
        index={0}
        serverVersion="3.6.0"
        onChange={spy}
        syntaxError={null}
        serverError={null}
        num_stages={0}
        editor_view_type="text"
      />
    );
  });

  afterEach(function () {
    component = null;
  });

  it('renders the wrapper div', function () {
    expect(component?.find('StageEditor')).to.exist;
  });
});
