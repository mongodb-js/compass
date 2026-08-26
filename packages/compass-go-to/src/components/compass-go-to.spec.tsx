import React from 'react';
import {
  render,
  screen,
  cleanup,
  fireEvent,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  ApplicationMenuContextProvider,
  type ApplicationMenuProvider,
} from '@mongodb-js/compass-electron-menu';
import type { CompassAppMenu } from '@mongodb-js/compass-electron-menu';
import { CompassGoTo } from './compass-go-to';

const initialUserAgent = navigator.userAgent;

describe('CompassGoTo', function () {
  let showApplicationMenu: sinon.SinonStub;
  let menuProvider: ApplicationMenuProvider;

  before(function () {
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
      writable: true,
    });
  });

  after(function () {
    Object.defineProperty(navigator, 'userAgent', {
      value: initialUserAgent,
      writable: true,
    });
  });

  beforeEach(function () {
    showApplicationMenu = sinon.stub().returns(() => {});
    menuProvider = {
      showApplicationMenu,
      handleMenuRole: sinon.stub().returns(() => {}),
    };
  });

  afterEach(cleanup);

  function renderGoTo(preferences: { enableGoTo?: boolean } = {}) {
    return render(
      <ApplicationMenuContextProvider provider={menuProvider}>
        <CompassGoTo />
      </ApplicationMenuContextProvider>,
      {
        preferences: {
          enableGoTo: true,
          ...preferences,
        },
      }
    );
  }

  function pressModP() {
    fireEvent.keyDown(document, { key: 'p', metaKey: true });
  }

  it('opens a top-centered palette with Search connections placeholder on mod+p', function () {
    renderGoTo();

    expect(screen.queryByTestId('go-to-palette')).to.equal(null);

    pressModP();

    expect(screen.getByTestId('go-to-palette')).to.be.visible;
    expect(screen.getByPlaceholderText('Search connections')).to.be.visible;
    expect(screen.getByTestId('go-to-results')).to.be.visible;
  });

  it('closes the palette on Escape', function () {
    renderGoTo();
    pressModP();
    expect(screen.getByTestId('go-to-palette')).to.be.visible;

    userEvent.keyboard('{Escape}');

    expect(screen.queryByTestId('go-to-palette')).to.equal(null);
  });

  it('closes the palette on click outside', function () {
    renderGoTo();
    pressModP();
    expect(screen.getByTestId('go-to-palette')).to.be.visible;

    userEvent.click(screen.getByTestId('go-to-backdrop'));

    expect(screen.queryByTestId('go-to-palette')).to.equal(null);
  });

  it('closes the palette when mod+p is pressed while open', function () {
    renderGoTo();
    pressModP();
    expect(screen.getByTestId('go-to-palette')).to.be.visible;

    pressModP();

    expect(screen.queryByTestId('go-to-palette')).to.equal(null);
  });

  it('registers File → Go to… with CmdOrCtrl+P when the flag is on', function () {
    renderGoTo();

    expect(showApplicationMenu.calledOnce).to.equal(true);
    const menu = showApplicationMenu.firstCall.args[0] as CompassAppMenu;
    expect(menu.label).to.equal('&File');
    expect(menu.submenu).to.have.length(1);
    expect(menu.submenu?.[0]).to.include({
      label: 'Go to…',
      accelerator: 'CmdOrCtrl+P',
    });
  });

  it('opens the palette from the File menu item', function () {
    renderGoTo();

    const menu = showApplicationMenu.firstCall.args[0] as CompassAppMenu;
    const click =
      menu.submenu?.[0] && 'click' in menu.submenu[0]
        ? menu.submenu[0].click
        : undefined;
    expect(click).to.be.a('function');
    click?.();

    expect(screen.getByTestId('go-to-palette')).to.be.visible;
  });

  it('does not open on mod+p when the flag is off', function () {
    renderGoTo({ enableGoTo: false });

    pressModP();

    expect(screen.queryByTestId('go-to-palette')).to.equal(null);
    expect(showApplicationMenu.called).to.equal(false);
  });
});
