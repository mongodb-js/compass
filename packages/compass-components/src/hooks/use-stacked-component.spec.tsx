import { cleanup, render, screen } from '@testing-library/react';
import { expect } from 'chai';
import React from 'react';

import {
  StackedComponentProvider,
  withStackedComponentPopoverStyles,
  withStackedComponentStyles,
} from './use-stacked-component';

const ComponentWithPopoverZIndexProp = withStackedComponentPopoverStyles(
  function ({ popoverZIndex }: { popoverZIndex?: number }) {
    return (
      <div
        data-testid="stacked-zindexed-component"
        style={{ zIndex: popoverZIndex }}
      />
    );
  }
);

const ComponentWithClassnameProp = withStackedComponentStyles(function ({
  className,
}: {
  className?: string;
}) {
  return (
    <div data-testid="stacked-classname-component" className={className} />
  );
});

describe('use-stacked-component', function () {
  afterEach(cleanup);

  context('with no provider', function () {
    context('popover z-index prop', function () {
      it('renders component with default z-index', function () {
        render(<ComponentWithPopoverZIndexProp />);
        const component = screen.getByTestId('stacked-zindexed-component');
        expect(component).to.exist;
        expect(component.style).to.have.property('z-index', '');
      });
      it('renders component with z-index', function () {
        render(<ComponentWithPopoverZIndexProp popoverZIndex={100} />);
        const component = screen.getByTestId('stacked-zindexed-component');
        expect(component).to.exist;
        expect(component.style).to.have.property('z-index', '100');
      });
    });

    context('classname prop', function () {
      it('renders component with no classname', function () {
        render(<ComponentWithClassnameProp />);
        const component = screen.getByTestId('stacked-classname-component');
        expect(component).to.exist;
        expect(component).to.have.property('className', '');
      });
      it('renders component with classname', function () {
        render(<ComponentWithClassnameProp className={'custom-className'} />);
        const component = screen.getByTestId('stacked-classname-component');
        expect(component).to.exist;
        expect(component).to.have.property('className', 'custom-className');
      });
    });
  });

  context('with provider', function () {
    context('popover z-index prop', function () {
      it('renders component with z-index from context', function () {
        render(
          <StackedComponentProvider zIndex={100}>
            <ComponentWithPopoverZIndexProp />
          </StackedComponentProvider>
        );
        const component = screen.getByTestId('stacked-zindexed-component');
        expect(component).to.exist;
        expect(component.style).to.have.property('z-index', '100');
      });
      it('renders component with z-index from the prop', function () {
        render(
          <StackedComponentProvider zIndex={100}>
            <ComponentWithPopoverZIndexProp popoverZIndex={20} />
          </StackedComponentProvider>
        );
        const component = screen.getByTestId('stacked-zindexed-component');
        expect(component).to.exist;
        expect(component.style).to.have.property('z-index', '20');
      });
    });

    context('classname prop', function () {
      it('renders component with no classname', function () {
        render(
          <StackedComponentProvider zIndex={100}>
            <ComponentWithClassnameProp />
          </StackedComponentProvider>
        );
        const component = screen.getByTestId('stacked-classname-component');
        expect(component).to.exist;
        // Expecting here to have only one classname applied.
        expect(component.className).to.match(/^leafygreen-ui-[a-z0-9]*/gi);
      });
      it('renders component with classname', function () {
        render(
          <StackedComponentProvider zIndex={100}>
            <ComponentWithClassnameProp className={'custom-className'} />
          </StackedComponentProvider>
        );
        const component = screen.getByTestId('stacked-classname-component');
        expect(component).to.exist;
        // Expecting here to have only two classnames applied. First one is the className (leafygreen-ui-*)
        // with zIndex style and then the custom-className from the prop.
        expect(component.className).to.match(
          /^leafygreen-ui-[a-z0-9]* custom-className/gi
        );
      });
    });
  });
});
