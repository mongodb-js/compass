import { cleanup, render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import React from 'react';

import {
  StackedComponentProvider,
  withStackedComponentStyles,
} from './use-stacked-component';

const ComponentWithStyleProp = withStackedComponentStyles(function ({
  style,
}: {
  style?: React.CSSProperties;
}) {
  return <div data-testid="stacked-classname-component" style={style} />;
});

describe('use-stacked-component', function () {
  afterEach(cleanup);

  context('with no provider', function () {
    it('renders component with no style', function () {
      render(<ComponentWithStyleProp />);
      const component = screen.getByTestId('stacked-classname-component');
      expect(component).to.exist;
      expect(component.style).to.have.property('z-index', '');
    });
    it('renders component with style', function () {
      render(<ComponentWithStyleProp style={{ height: 100 }} />);
      const component = screen.getByTestId('stacked-classname-component');
      expect(component).to.exist;
      expect(component.style).to.have.property('height', '100px');
    });
  });

  context('with provider', function () {
    it('renders component with no style', function () {
      render(
        <StackedComponentProvider zIndex={100}>
          <ComponentWithStyleProp />
        </StackedComponentProvider>
      );
      const component = screen.getByTestId('stacked-classname-component');
      expect(component).to.exist;
      expect(component.style.zIndex).to.equal('100');
    });
    it('renders component with classname', function () {
      render(
        <StackedComponentProvider zIndex={100}>
          <ComponentWithStyleProp style={{ zIndex: 20 }} />
        </StackedComponentProvider>
      );
      const component = screen.getByTestId('stacked-classname-component');
      expect(component).to.exist;
      expect(component.style.zIndex).to.equal('20');
    });
  });
});
