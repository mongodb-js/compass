import React, { useState } from 'react';
import { expect } from 'chai';
import {
  cleanup,
  render,
  screen,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import VisibleFieldsToggle from './visible-field-toggle';

function TestComponent({
  initialSize = 10,
  showHideButton = true,
  totalSize = Infinity,
  minSize = 10,
  step = 10,
  parentFieldName,
}: {
  initialSize?: number;
  showHideButton?: boolean;
  totalSize?: number;
  minSize?: number;
  step?: number;
  parentFieldName?: string;
}) {
  const [size, setSize] = useState(initialSize);

  return (
    <div>
      <div>Showing {size} items</div>
      <VisibleFieldsToggle
        currentSize={size}
        showHideButton={showHideButton}
        totalSize={totalSize}
        minSize={minSize}
        step={step}
        onSizeChange={setSize}
        parentFieldName={parentFieldName}
      ></VisibleFieldsToggle>
    </div>
  );
}

describe('DocumentFieldsToggleGroup', function () {
  afterEach(cleanup);

  it('should show "Show more items" button if more items can be shown', function () {
    render(<TestComponent></TestComponent>);
    expect(screen.getByText('Show 10 more fields')).to.exist;
  });

  it('should show "Hide items" button displaying more items than minSize', function () {
    render(<TestComponent initialSize={10} minSize={0}></TestComponent>);
    expect(screen.getByText('Hide 10 fields')).to.exist;
  });

  it('should include parentFieldName in the label when provided', function () {
    render(
      <TestComponent
        initialSize={10}
        minSize={0}
        parentFieldName="reviews"
      ></TestComponent>
    );
    expect(screen.getByText('Hide 10 fields in reviews')).to.exist;
  });

  it('should show more items when "Show items" is clicked', function () {
    render(<TestComponent></TestComponent>);
    expect(screen.getByText('Showing 10 items')).to.exist;
    userEvent.click(screen.getByText('Show 10 more fields'), undefined, {
      // Because leafygreen
      skipPointerEventsCheck: true,
    });
    expect(screen.getByText('Showing 20 items')).to.exist;
  });

  it('should reset items to minSize when "Hide items" is clicked', function () {
    render(<TestComponent minSize={10} initialSize={20}></TestComponent>);
    expect(screen.getByText('Showing 20 items')).to.exist;
    userEvent.click(screen.getByText('Hide 10 fields'), undefined, {
      // Because leafygreen
      skipPointerEventsCheck: true,
    });
    expect(screen.getByText('Showing 10 items')).to.exist;
  });

  it('should not show any buttons if no additional fields can be shown or hidden', function () {
    render(
      <TestComponent
        minSize={10}
        initialSize={10}
        totalSize={10}
      ></TestComponent>
    );

    expect(screen.queryByTestId('show-more-fields-button')).to.eq(null);
    expect(screen.queryByTestId('hide-fields-button')).to.eq(null);
  });
});
