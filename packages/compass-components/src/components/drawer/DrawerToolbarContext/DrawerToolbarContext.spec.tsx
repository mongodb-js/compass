import React from 'react';
import { act, waitFor } from '@testing-library/react';

import { renderHook } from '@leafygreen-ui/testing-lib';

import { drawerTransitionDuration } from '../Drawer/Drawer.styles';

import {
  DrawerToolbarProvider,
  useDrawerToolbarContext,
} from './DrawerToolbarContext';
import { ContextData } from './DrawerToolbarContext.types';

const mockData: Array<ContextData> = [
  {
    id: 'one',
    content: <div>Drawer 1 Content</div>,
    label: 'Drawer 1',
    glyph: 'Code',
    title: 'Drawer 1',
  },
  {
    id: 'two',
    content: <div>Drawer 2 Content</div>,
    label: 'Drawer 2',
    glyph: 'Apps',
    title: 'Drawer 2',
  },
  {
    id: 'three',
    content: <div>Drawer 3 Content</div>,
    label: 'Drawer 3',
    glyph: 'Bell',
    title: 'Drawer 3',
  },
  {
    id: 'four',
    glyph: 'Plus',
    label: 'Drawer 4',
  },
];

describe('useDrawerToolbarContext', () => {
  test('throws error when used outside of DrawerToolbarProvider', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useDrawerToolbarContext());
    }).toThrow(
      'useDrawerToolbarContext must be used within a DrawerToolbarProvider'
    );

    consoleSpy.mockRestore();
  });

  describe('getActiveDrawerContent', () => {
    describe('on initial call', () => {
      test('returns undefined ', () => {
        const { result } = renderHook(useDrawerToolbarContext, {
          wrapper: ({ children }) => (
            <DrawerToolbarProvider data={mockData}>
              {children}
            </DrawerToolbarProvider>
          ),
        });

        expect(result.current.getActiveDrawerContent()).toBeUndefined();
      });

      test('updates when openDrawer is called', () => {
        const { result } = renderHook(useDrawerToolbarContext, {
          wrapper: ({ children }) => (
            <DrawerToolbarProvider data={mockData}>
              {children}
            </DrawerToolbarProvider>
          ),
        });

        act(() => result.current.openDrawer('one'));
        expect(result.current.getActiveDrawerContent()).toEqual(mockData[0]);
      });

      test('throws error if the id does not match an id from the data', () => {
        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        const { result } = renderHook(useDrawerToolbarContext, {
          wrapper: ({ children }) => (
            <DrawerToolbarProvider data={mockData}>
              {children}
            </DrawerToolbarProvider>
          ),
        });

        act(() => result.current.openDrawer('onee'));
        expect(consoleSpy).toHaveBeenCalledWith(
          'No matching item found in the toolbar for the provided id: onee. Please verify that the id is correct.'
        );
      });

      test('returns undefined if the id does not match an id from the data', () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(useDrawerToolbarContext, {
          wrapper: ({ children }) => (
            <DrawerToolbarProvider data={mockData}>
              {children}
            </DrawerToolbarProvider>
          ),
        });

        act(() => result.current.openDrawer('onee'));
        expect(result.current.getActiveDrawerContent()).toEqual(undefined);
      });

      test('returns undefined when closeDrawer is called', () => {
        const { result } = renderHook(useDrawerToolbarContext, {
          wrapper: ({ children }) => (
            <DrawerToolbarProvider data={mockData}>
              {children}
            </DrawerToolbarProvider>
          ),
        });

        act(() => result.current.closeDrawer());
        expect(result.current.getActiveDrawerContent()).toEqual(undefined);
      });
    });
    describe('on subsequent calls', () => {
      test('returns the correct content in sequence', () => {
        const { result } = renderHook(useDrawerToolbarContext, {
          wrapper: ({ children }) => (
            <DrawerToolbarProvider data={mockData}>
              {children}
            </DrawerToolbarProvider>
          ),
        });

        act(() => result.current.openDrawer('one'));
        expect(result.current.getActiveDrawerContent()).toEqual(mockData[0]);

        act(() => result.current.openDrawer('two'));
        expect(result.current.getActiveDrawerContent()).toEqual(mockData[1]);

        act(() => result.current.openDrawer('three'));
        expect(result.current.getActiveDrawerContent()).toEqual(mockData[2]);
      });

      test('returns the correct content when openDrawer is called with the same id', () => {
        const { result } = renderHook(useDrawerToolbarContext, {
          wrapper: ({ children }) => (
            <DrawerToolbarProvider data={mockData}>
              {children}
            </DrawerToolbarProvider>
          ),
        });

        act(() => result.current.openDrawer('one'));
        expect(result.current.getActiveDrawerContent()).toEqual(mockData[0]);

        act(() => result.current.openDrawer('one'));
        expect(result.current.getActiveDrawerContent()).toEqual(mockData[0]);
      });

      test('returns the correct content when openDrawer is called with an id that does not match any ids from the data', () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const { result } = renderHook(useDrawerToolbarContext, {
          wrapper: ({ children }) => (
            <DrawerToolbarProvider data={mockData}>
              {children}
            </DrawerToolbarProvider>
          ),
        });

        act(() => result.current.openDrawer('one'));
        expect(result.current.getActiveDrawerContent()).toEqual(mockData[0]);

        act(() => result.current.openDrawer('twoo'));
        expect(result.current.getActiveDrawerContent()).toEqual(mockData[0]);
      });

      test('throws error if the id does not match an id from the data', () => {
        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        const { result } = renderHook(useDrawerToolbarContext, {
          wrapper: ({ children }) => (
            <DrawerToolbarProvider data={mockData}>
              {children}
            </DrawerToolbarProvider>
          ),
        });

        act(() => result.current.openDrawer('one'));
        expect(result.current.getActiveDrawerContent()).toEqual(mockData[0]);
        act(() => result.current.openDrawer('twoo'));
        expect(consoleSpy).toHaveBeenCalledWith(
          'No matching item found in the toolbar for the provided id: twoo. Please verify that the id is correct.'
        );
      });

      test('returns undefined when closeDrawer is called', async () => {
        const { result } = renderHook(useDrawerToolbarContext, {
          wrapper: ({ children }) => (
            <DrawerToolbarProvider data={mockData}>
              {children}
            </DrawerToolbarProvider>
          ),
        });

        act(() => result.current.openDrawer('one'));
        expect(result.current.getActiveDrawerContent()).toEqual(mockData[0]);

        act(() => result.current.closeDrawer());
        await new Promise((resolve) =>
          setTimeout(resolve, drawerTransitionDuration)
        );
        await waitFor(() =>
          expect(result.current.getActiveDrawerContent()).toBeUndefined()
        );
      });
    });
  });

  describe('DrawerToolbarProvider', () => {
    test('returns undefined with no data', () => {
      const { result } = renderHook(useDrawerToolbarContext, {
        wrapper: ({ children }) => (
          <DrawerToolbarProvider data={[]}>{children}</DrawerToolbarProvider>
        ),
      });

      expect(result.current.getActiveDrawerContent()).toBeUndefined();
      act(() => result.current.openDrawer('any'));
      expect(result.current.getActiveDrawerContent()).toBeUndefined();
    });
  });

  test('handles multiple closeDrawer calls gracefully', async () => {
    const { result } = renderHook(useDrawerToolbarContext, {
      wrapper: ({ children }) => (
        <DrawerToolbarProvider data={mockData}>
          {children}
        </DrawerToolbarProvider>
      ),
    });

    act(() => result.current.openDrawer('one'));
    expect(result.current.getActiveDrawerContent()).toEqual(mockData[0]);

    act(() => result.current.closeDrawer());
    act(() => result.current.closeDrawer()); // Call close multiple times
    await new Promise((resolve) =>
      setTimeout(resolve, drawerTransitionDuration)
    );
    await waitFor(() =>
      expect(result.current.getActiveDrawerContent()).toBeUndefined()
    );
  });
});
