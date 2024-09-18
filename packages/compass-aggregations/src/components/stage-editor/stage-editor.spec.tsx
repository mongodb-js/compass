import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import sinon from 'sinon';
import { expect } from 'chai';

import { StageEditor } from './stage-editor';

describe('StageEditor [Component]', function () {
  const spy = sinon.spy();
  const stage = '{ name: "testing" }';
  const stageOperator = '$match';

  beforeEach(function () {
    render(
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

  it('renders the wrapper div', function () {
    expect(screen.getByTestId('stage-editor')).to.exist;
  });
});
