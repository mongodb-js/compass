import { fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import { renderHook } from '@testing-library/react-hooks';

import { useHotkeys, mapKeyToShortcut } from './use-hotkeys';
import sinon from 'sinon';

const initialUserAgent = window.navigator.userAgent;

const mappingUseCases = {
  mac: [
    { key: 'meta+1', shortcut: '⌘ + 1' },
    { key: 'alt+  1', shortcut: 'option + 1' },
    { key: 'ctrl  +1', shortcut: 'ctrl + 1' },
    { key: 'meta +shift+  a+ c', shortcut: '⌘ + shift + a + c' },
    { key: 'meta+ shift +   +', shortcut: '⌘ + shift + +' },
  ],
  windows_linux: [
    { key: 'meta+1', shortcut: 'ctrl + 1' },
    { key: 'alt+1', shortcut: 'alt + 1' },
    { key: 'ctrl+1', shortcut: 'ctrl + 1' },
    { key: 'meta+ shift+a +c', shortcut: 'ctrl + shift + a + c' },
    { key: 'meta +shift  + +', shortcut: 'ctrl + shift + +' },
  ],
};

describe('use-hotkeys', function () {
  after(function () {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: initialUserAgent,
      writable: true,
    });
  });

  context('on macOS', function () {
    before(function () {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
        writable: true,
      });
    });

    it('handles meta key and maps it to command', function () {
      const callback = sinon.spy();
      renderHook(() => useHotkeys('meta + 1', callback));
      expect(callback).not.to.have.been.called;
      fireEvent.keyDown(document, { key: '1', metaKey: true });
      expect(callback).to.have.been.calledOnce;
    });

    it('handles alt key and maps it to option', function () {
      const callback = sinon.spy();
      renderHook(() => useHotkeys('alt + 1', callback));
      expect(callback).not.to.have.been.called;
      fireEvent.keyDown(document, { key: '1', altKey: true });
      expect(callback).to.have.been.calledOnce;
    });

    it('handles ctrl key and maps it to ctrl', function () {
      const callback = sinon.spy();
      renderHook(() => useHotkeys('ctrl + 1', callback));
      expect(callback).not.to.have.been.called;
      fireEvent.keyDown(document, { key: '1', ctrlKey: true });
      expect(callback).to.have.been.calledOnce;
    });

    context('handles mapping of shortcuts', function () {
      mappingUseCases.mac.forEach(({ key, shortcut }) => {
        it(`maps ${key} to ${shortcut}`, function () {
          expect(mapKeyToShortcut(key)).to.equal(shortcut);
        });
      });
    });
  });

  context('on Windows/Linux', function () {
    before(function () {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
        writable: true,
      });
    });

    it('handles meta key and maps it to ctrl', function () {
      const callback = sinon.spy();
      renderHook(() => useHotkeys('meta + 1', callback));
      expect(callback).not.to.have.been.called;
      fireEvent.keyDown(document, { key: '1', metaKey: true });
      expect(callback).to.have.been.calledOnce;
    });

    it('handles alt key and maps it to alt', function () {
      const callback = sinon.spy();
      renderHook(() => useHotkeys('alt + 1', callback));
      expect(callback).not.to.have.been.called;
      fireEvent.keyDown(document, { key: '1', altKey: true });
      expect(callback).to.have.been.calledOnce;
    });

    it('handles ctrl key and maps it to ctrl', function () {
      const callback = sinon.spy();
      renderHook(() => useHotkeys('ctrl + 1', callback));
      expect(callback).not.to.have.been.called;
      fireEvent.keyDown(document, { key: '1', ctrlKey: true });
      expect(callback).to.have.been.calledOnce;
    });

    context('handles mapping of shortcuts', function () {
      mappingUseCases.windows_linux.forEach(({ key, shortcut }) => {
        it(`maps ${key} to ${shortcut}`, function () {
          expect(mapKeyToShortcut(key)).to.equal(shortcut);
        });
      });
    });
  });
});
