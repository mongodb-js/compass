import React from 'react';
import { expect } from 'chai';
import { EventEmitter } from 'events';
import { WorkspaceTab } from './index';
import {
  renderWithActiveConnection,
  screen,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { RuntimeMap } from './stores/store';
import { palette, ThemeProvider, Themes } from '@mongodb-js/compass-components';
import type { ShellRuntime } from './modules/shell-runtime';

type EvaluateArgs = Parameters<ShellRuntime['evaluate']>;

type TestRuntime = Pick<ShellRuntime, 'evaluate' | 'terminate'> & {
  eventEmitter: EventEmitter;
};

function setTestRuntime(
  onEvaluate: (...args: EvaluateArgs) => void = () => {}
) {
  const runtime: TestRuntime = {
    eventEmitter: new EventEmitter(),
    terminate() {
      return Promise.resolve();
    },
    evaluate(...args) {
      onEvaluate(...args);
      return Promise.resolve({ type: null, printable: undefined });
    },
  };

  RuntimeMap.set('test', runtime as unknown as ShellRuntime);
}

async function renderShellBackgroundColor({
  shellFollowsCompassTheme,
  compassTheme,
}: {
  shellFollowsCompassTheme: boolean;
  compassTheme: (typeof Themes)[keyof typeof Themes];
}) {
  setTestRuntime();
  const ShellContentComponent = WorkspaceTab.content;
  await renderWithActiveConnection(
    <ThemeProvider theme={{ theme: compassTheme, enabled: true }}>
      <WorkspaceTab.provider runtimeId="test">
        <ShellContentComponent />
      </WorkspaceTab.provider>
    </ThemeProvider>,
    undefined,
    { preferences: { shellFollowsCompassTheme } }
  );
  const shellSection = await screen.findByTestId('shell-section');
  return getComputedStyle(shellSection).backgroundColor;
}

// Computed styles report colors as rgb(), so let the DOM normalize the
// palette's hex values the same way.
function toCssColor(color: string) {
  const element = document.createElement('div');
  element.style.backgroundColor = color;
  return element.style.backgroundColor;
}

const DARK_BACKGROUND = toCssColor(palette.gray.dark4);
const LIGHT_BACKGROUND = toCssColor(palette.white);

describe('CompassShellPlugin WorkspaceTab', function () {
  it('returns a renderable plugin', async function () {
    const attemptedEvals: EvaluateArgs[] = [];
    setTestRuntime((...args) => attemptedEvals.push(args));

    const ShellContentComponent = WorkspaceTab.content;
    await renderWithActiveConnection(
      <WorkspaceTab.provider runtimeId="test">
        <ShellContentComponent />
      </WorkspaceTab.provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('shell-section')).to.exist;
      expect(attemptedEvals).to.deep.equal([['version()']]);
    });
  });

  describe('theme', function () {
    const cases = [
      { follows: false, compass: Themes.Light, expected: DARK_BACKGROUND },
      { follows: false, compass: Themes.Dark, expected: DARK_BACKGROUND },
      { follows: true, compass: Themes.Light, expected: LIGHT_BACKGROUND },
      { follows: true, compass: Themes.Dark, expected: DARK_BACKGROUND },
    ];

    for (const { follows, compass, expected } of cases) {
      const shellTheme = expected === DARK_BACKGROUND ? 'dark' : 'light';
      it(`is ${shellTheme} when shellFollowsCompassTheme is ${String(
        follows
      )} and Compass theme is ${compass}`, async function () {
        expect(
          await renderShellBackgroundColor({
            shellFollowsCompassTheme: follows,
            compassTheme: compass,
          })
        ).to.equal(expected);
      });
    }
  });
});
