import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { withPreferences } from 'compass-preferences-model/provider';
import { Shell } from '@mongosh/browser-repl';
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
import type { RootState } from '../../stores/store';
import { saveHistory, selectRuntimeById } from '../../stores/store';

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
  runtime: WorkerRuntime | null;
  shellOutput?: ShellOutputEntry[];
  enableShell: boolean;
  initialHistory: string[] | null;
  onHistoryChange: (history: string[]) => void;
}

interface CompassShellState {
  height: number;
  prevHeight: number;
  isOperationInProgress: boolean;
  showInfoModal: boolean;
}

type ShellProps = React.ComponentProps<typeof Shell>;

type ShellRef = Extract<Required<ShellProps>['ref'], { current: any }>;

type ShellOutputEntry = Required<ShellProps>['initialOutput'][number];

export class CompassShell extends Component<
  CompassShellProps,
  CompassShellState
> {
  shellRef: ShellRef = React.createRef();
  shellOutput: readonly ShellOutputEntry[];

  static defaultProps = {
    runtime: null,
  };
  constructor(props: CompassShellProps) {
    super(props);

    this.shellOutput = this.props.shellOutput || [];

    this.state = {
      height: shellHeightClosed,
      prevHeight: defaultShellHeightOpened,
      isOperationInProgress: false,
      showInfoModal: false,
    };
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
      this.shellRef.current.focusEditor();
    }
  }

  render() {
    const { height, prevHeight, isOperationInProgress, showInfoModal } =
      this.state;

    if (
      !this.props.enableShell ||
      !this.props.runtime ||
      !this.props.initialHistory
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
              initialHistory={this.props.initialHistory}
              initialOutput={this.shellOutput}
              onHistoryChanged={(history) => {
                this.props.onHistoryChange([...history]);
              }}
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

export default connect(
  (state: RootState) => {
    return {
      runtime: selectRuntimeById(state),
      initialHistory: state.history,
    };
  },
  { onHistoryChange: saveHistory }
)(withPreferences(CompassShell, ['enableShell']));
