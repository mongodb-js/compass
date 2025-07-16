import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  DrawerStackProvider,
  useDrawerStackContext,
} from './DrawerStackContext';

describe('DrawerStackContext', () => {
  const TestComponent = () => {
    const { registerDrawer, unregisterDrawer, getDrawerIndex } =
      useDrawerStackContext();
    return (
      <div>
        <button onClick={() => registerDrawer('drawer1')}>
          Register Drawer 1
        </button>
        <button onClick={() => unregisterDrawer('drawer1')}>
          Unregister Drawer 1
        </button>
        <span data-testid="drawer1-index">{getDrawerIndex('drawer1')}</span>
      </div>
    );
  };

  it('should register a drawer', () => {
    const { getByText, getByTestId } = render(
      <DrawerStackProvider>
        <TestComponent />
      </DrawerStackProvider>
    );

    userEvent.click(getByText('Register Drawer 1'));

    expect(getByTestId('drawer1-index').textContent).toBe('0');
  });

  it('should unregister a drawer', () => {
    const { getByText, getByTestId } = render(
      <DrawerStackProvider>
        <TestComponent />
      </DrawerStackProvider>
    );

    userEvent.click(getByText('Register Drawer 1'));
    userEvent.click(getByText('Unregister Drawer 1'));

    expect(getByTestId('drawer1-index').textContent).toBe('-1');
  });

  it('should return the correct index for a registered drawer', () => {
    const { getByText, getByTestId } = render(
      <DrawerStackProvider>
        <TestComponent />
      </DrawerStackProvider>
    );

    userEvent.click(getByText('Register Drawer 1'));
    userEvent.click(getByText('Register Drawer 1'));

    expect(getByTestId('drawer1-index').textContent).toBe('0');
  });
});
