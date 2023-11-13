import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withPreferences } from 'compass-preferences-model';
import type { Shell as ShellType } from '@mongosh/browser-repl';

// The browser-repl package.json defines exports['.'].require but not .module, hence require() instead of import
const { Shell } =
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/consistent-type-imports
  require('@mongosh/browser-repl') as typeof import('@mongosh/browser-repl');
import {
  ResizeHandle,
  ResizeDirection,
  css,
  cx,
  getScrollbarStyles,
  palette,
} from '@mongodb-js/compass-components';

import ShellInfoModal from '../shell-info-modal';
import ShellHeader from '../shell-header';
import type { WorkerRuntime } from '@mongosh/node-runtime-worker-thread';
import type { HistoryStorage } from '../../modules/history-storage';
import type { RootState } from '../../modules';

const compassShellStyles = css(
  {
    backgroundColor: palette.gray.dark4,
    display: 'flex',
    flexBasis: 'auto',
    position: 'relative',
    flexDirection: 'column',
    width: '100vw',
  },
  getScrollbarStyles(true /* Always show dark mode. */)
);

const compassShellContainerStyles = css({
  flexGrow: 1,
  display: 'none',
  overflow: 'auto',
  borderTop: `1px solid ${palette.gray.dark2}`,
});

const compassShellContainerVisibleStyles = css({
  display: 'flex',
});

const defaultShellHeightOpened = 240;
const shellHeightClosed = 32;
const shellMinHeightOpened = 100;

function getMaxShellHeight() {
  return Math.max(defaultShellHeightOpened, window.innerHeight - 100);
}

// Apply bounds to the shell height when resizing to ensure it's always
// visible and usable to the user.
function boundShellHeight(attemptedHeight: number): number {
  const maxHeight = getMaxShellHeight();

  return Math.min(maxHeight, Math.max(shellMinHeightOpened, attemptedHeight));
}

export interface CompassShellProps {
  emitShellPluginOpened?: () => void;
  runtime: WorkerRuntime | null;
  shellOutput?: ShellOutputEntry[];
  historyStorage?: HistoryStorage;
  enableShell: boolean;
}

interface CompassShellState {
  height: number;
  prevHeight: number;
  initialHistory: string[] | null;
  isOperationInProgress: boolean;
  showInfoModal: boolean;
}

type ShellOutputEntry = ShellType['state']['output'][number];

export class CompassShell extends Component<
  CompassShellProps,
  CompassShellState
> {
  static propTypes = {
    emitShellPluginOpened: PropTypes.func,
    runtime: PropTypes.object,
    shellOutput: PropTypes.array,
    historyStorage: PropTypes.object,
    enableShell: PropTypes.bool,
  };

  shellRef = React.createRef<ShellType>();
  shellOutput: readonly ShellOutputEntry[];

  static defaultProps = {
    emitShellPluginOpened: () => {
      /* ignore */
    },
    runtime: null,
  };
  constructor(props: CompassShellProps) {
    super(props);

    this.shellOutput = this.props.shellOutput || [];

    this.state = {
      height: shellHeightClosed,
      prevHeight: defaultShellHeightOpened,
      initialHistory: this.props.historyStorage ? null : [],
      isOperationInProgress: false,
      showInfoModal: false,
    };
  }

  componentDidMount() {
    void this.loadHistory();
    window.addEventListener('beforeunload', this.terminateRuntime);
  }

  componentDidUpdate(
    prevProps: CompassShellProps,
    prevState: CompassShellState
  ) {
    const { height } = this.state;
    if (
      prevState.height < shellMinHeightOpened &&
      height > shellMinHeightOpened
    ) {
      this.props.emitShellPluginOpened?.();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.terminateRuntime);
  }

  onShellOutputChanged = (output: readonly ShellOutputEntry[]) => {
    this.shellOutput = output;
  };

  onOperationStarted = () => {
    this.setState({
      isOperationInProgress: true,
    });
  };

  onOperationEnd = () => {
    this.setState({
      isOperationInProgress: false,
    });
  };

  terminateRuntime = () => {
    if (this.props.runtime) {
      void this.props.runtime.terminate();
    }
  };

  saveHistory = (history: readonly string[]) => {
    void (async () => {
      if (!this.props.historyStorage) {
        return;
      }

      try {
        await this.props.historyStorage.save([...history]);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    })();
  };

  loadHistory = async () => {
    if (!this.props.historyStorage) {
      return;
    }

    try {
      const history = await this.props.historyStorage.load();
      this.setState({
        initialHistory: history,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      this.setState({
        initialHistory: [],
      });
    }
  };

  updateHeight(height: number) {
    if (height > shellMinHeightOpened) {
      this.setState({
        height,
        // Store the previous height to use when toggling open/close
        // when we resize while the shell is expanded.
        prevHeight: height,
      });
    } else {
      this.setState({
        height,
      });
    }
  }

  hideInfoModal() {
    this.setState({ showInfoModal: false });
  }

  focusEditor() {
    if (this.shellRef.current && window.getSelection()?.type !== 'Range') {
      (this.shellRef.current as any) /* private ... */
        .focusEditor();
    }
  }

  /**
   * Render CompassShell component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const { height, prevHeight, isOperationInProgress, showInfoModal } =
      this.state;

    if (
      !this.props.enableShell ||
      !this.props.runtime ||
      !this.state.initialHistory
    ) {
      return <div />;
    }

    const isExpanded = height > shellMinHeightOpened;
    const renderedHeight = isExpanded
      ? boundShellHeight(height)
      : shellHeightClosed;

    return (
      <Fragment>
        <ShellInfoModal
          show={showInfoModal}
          hideInfoModal={this.hideInfoModal.bind(this)}
        />
        {/* Clicking on the shell container to focus it is a ux improvement to give
            the shell more of a native shell feeling. We disable the jsx-ally rules
            as this is a unique ux improvement solely for clicking. */}
        {/* eslint-disable jsx-a11y/no-static-element-interactions */}
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
        <div
          data-testid="shell-section"
          className={compassShellStyles}
          style={{ height: renderedHeight }}
          id="content"
          onClick={this.focusEditor.bind(this)}
        >
          {/* eslint-enable jsx-a11y/no-static-element-interactions */}
          <ResizeHandle
            direction={ResizeDirection.TOP}
            onChange={(newHeight) => this.updateHeight(newHeight)}
            value={height}
            minValue={shellHeightClosed}
            maxValue={getMaxShellHeight()}
            title="MongoDB Shell"
          />
          <ShellHeader
            isExpanded={isExpanded}
            onShellToggleClicked={() =>
              isExpanded
                ? this.updateHeight(shellHeightClosed)
                : this.updateHeight(prevHeight)
            }
            isOperationInProgress={isOperationInProgress}
            showInfoModal={() => this.setState({ showInfoModal: true })}
          />
          <div
            data-testid="shell-content"
            className={cx(
              compassShellContainerStyles,
              isExpanded && compassShellContainerVisibleStyles
            )}
          >
            <Shell
              ref={this.shellRef}
              runtime={this.props.runtime}
              initialHistory={this.state.initialHistory}
              initialOutput={this.shellOutput}
              onHistoryChanged={this.saveHistory}
              onOutputChanged={this.onShellOutputChanged}
              onOperationStarted={this.onOperationStarted}
              onOperationEnd={this.onOperationEnd}
            />
          </div>
        </div>
      </Fragment>
    );
  }
}

export default connect((state: RootState) => ({
  emitShellPluginOpened: () => {
    state.runtime.appRegistry?.emit('compass:compass-shell:opened');
  },
  runtime: state.runtime ? state.runtime.runtime : null,
}))(withPreferences(CompassShell, ['enableShell'], React));
