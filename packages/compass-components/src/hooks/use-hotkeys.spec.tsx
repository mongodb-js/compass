import { fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import { renderHook } from '@testing-library/react-hooks';

import { useHotkeys, formatHotkey } from './use-hotkeys';
import sinon from 'sinon';

const initialUserAgent = window.navigator.userAgent;

const mappingUseCases = {
  mac: [
    { key: 'meta+1', shortcut: '⌘ + 1' },
    { key: 'alt+  1', shortcut: 'Option + 1' },
    { key: 'ctrl  +1', shortcut: 'Ctrl + 1' },
    { key: 'meta +shift+  a+ c', shortcut: '⌘ + Shift + A + C' },
    { key: 'meta+ shift +   +', shortcut: '⌘ + Shift + +' },
    { key: 'META+ SHIFT +   +', shortcut: '⌘ + Shift + +' },
    { key: 'META+ArrowUp', shortcut: '⌘ + ↑' },
    { key: 'shift+ArrowDown', shortcut: 'Shift + ↓' },
  ],
  windows_linux: [
    { key: 'meta+1', shortcut: 'Ctrl + 1' },
    { key: 'alt+1', shortcut: 'Alt + 1' },
    { key: 'ctrl+1', shortcut: 'Ctrl + 1' },
    { key: 'meta+ shift+a +c', shortcut: 'Ctrl + Shift + A + C' },
    { key: 'meta +shift  + +', shortcut: 'Ctrl + Shift + +' },
    { key: 'META+SHIFT  + +', shortcut: 'Ctrl + Shift + +' },
    { key: 'META+ArrowUp', shortcut: 'Ctrl + ↑' },
    { key: 'shift+ArrowDown', shortcut: 'Shift + ↓' },
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
          expect(formatHotkey(key)).to.equal(shortcut);
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
          expect(formatHotkey(key)).to.equal(shortcut);
        });
      });
    });
  });
});
