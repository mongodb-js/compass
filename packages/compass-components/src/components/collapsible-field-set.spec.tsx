import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';

import { TextInput } from './leafygreen';
import { render, screen, cleanup } from '@testing-library/react';

import { CollapsibleFieldSet } from './collapsible-field-set';

function collapsibleFieldSet(toggled: boolean) {
  const onToggleSpy = sinon.spy();
  return (
    <CollapsibleFieldSet
      toggled={toggled}
      onToggle={onToggleSpy}
      label="Test"
      data-testid="my-fieldset"
      description="Some description."
    >
      <TextInput
        data-testid="my-input"
        label="Test input"
        value={'Hello World'}
        type="text"
      />
    </CollapsibleFieldSet>
  );
}

describe('CollapsibleFieldSet Component', function () {
  afterEach(cleanup);

  it('should not display a child input', function () {
    render(collapsibleFieldSet(false));
    const checkbox = screen.getByTestId('my-fieldset-checkbox');
    expect(checkbox).to.exist;
    expect(screen.queryByTestId('my-input')).to.not.exist;
  });

  it('should display a child input', function () {
    render(collapsibleFieldSet(true));
    const checkbox = screen.getByTestId('my-fieldset-checkbox');
    expect(checkbox).to.exist;
    expect(screen.queryByTestId('my-input')).to.exist;
  });
});
