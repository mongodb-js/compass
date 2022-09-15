import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Shell } from '@mongosh/browser-repl';
import { ResizeHandle, ResizeDirection, css, cx, uiColors } from '@mongodb-js/compass-components';

import InfoModal from '../info-modal';
import ShellHeader from '../shell-header';

const compassShellStyles = css({
  backgroundColor: uiColors.gray.dark3,
  display: 'flex',
  flexBasis: 'auto',
  position: 'relative',
  flexDirection: 'column',
  maxHeight: '95%'
});

const compassShellContainerStyles = css({
  flexGrow: 1,
  display: 'none',
  overflow: 'auto',
  borderTop: `1px solid ${uiColors.gray.dark2}`,
  '*::-webkit-scrollbar-thumb': {
    background: 'rgba(180, 180, 180, 0.5)'
  }
});

const compassShellContainerVisibleStyles = css({
  display: 'flex'
});

const defaultShellHeightOpened = 240;
const shellHeightClosed = 32;
const shellMinHeightOpened = 100;

function getMaxShellHeight() {
  return Math.max(defaultShellHeightOpened, window.innerHeight - 100);
}

// Apply bounds to the shell height when resizing to ensure it's always
// visible and usable to the user.
function boundShellHeight(attemptedHeight) {
  const maxHeight = getMaxShellHeight();

  return Math.min(maxHeight, Math.max(shellMinHeightOpened, attemptedHeight));
}

export class CompassShell extends Component {
  static propTypes = {
    emitShellPluginOpened: PropTypes.func,
    runtime: PropTypes.object,
    shellOutput: PropTypes.array,
    historyStorage: PropTypes.object
  };

  static defaultProps = {
    emitShellPluginOpened: () => {},
    runtime: null
  };
  constructor(props) {
    super(props);

    this.shellRef = React.createRef();

    this.shellOutput = this.props.shellOutput || [];

    this.state = {
      height: shellHeightClosed,
      prevHeight: defaultShellHeightOpened,
      initialHistory: this.props.historyStorage ? null : [],
      isOperationInProgress: false,
      showInfoModal: false
    };
  }

  componentDidMount() {
    this.loadHistory();
    window.addEventListener('beforeunload', this.terminateRuntime);
  }

  componentDidUpdate(prevProps, prevState) {
    const { height } = this.state;
    if (prevState.height < shellMinHeightOpened && height > shellMinHeightOpened) {
      this.props.emitShellPluginOpened();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.terminateRuntime);
  }

  onShellOutputChanged = (output) => {
    this.shellOutput = output;
  }

  onOperationStarted = () => {
    this.setState({
      isOperationInProgress: true
    });
  }

  onOperationEnd = () => {
    this.setState({
      isOperationInProgress: false
    });
  }

  terminateRuntime = () => {
    if (this.props.runtime) {
      this.props.runtime.terminate();
    }
  }

  saveHistory = async(history) => {
    if (!this.props.historyStorage) {
      return;
    }

    try {
      await this.props.historyStorage.save(history);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  loadHistory = async() => {
    if (!this.props.historyStorage) {
      return;
    }

    try {
      const history = await this.props.historyStorage.load();
      this.setState({
        initialHistory: history
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      this.setState({
        initialHistory: []
      });
    }
  }

  updateHeight(height) {
    this.setState(
      (height > shellMinHeightOpened)
        ? {
          height,
          // Store the previous height to use when toggling open/close
          // when we resize while the shell is expanded.
          prevHeight: height
        } : {
          height
        }
    );
  }

  hideInfoModal() {
    this.setState({ showInfoModal: false });
  }

  focusEditor() {
    if (this.shellRef.current && window.getSelection()?.type !== 'Range') {
      this.shellRef.current.focusEditor();
    }
  }

  /**
   * Render CompassShell component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const {
      height,
      prevHeight,
      isOperationInProgress,
      showInfoModal
    } = this.state;

    if (!this.props.runtime || !this.state.initialHistory) {
      return (<div />);
    }

    const isExpanded = height > shellMinHeightOpened;
    const renderedHeight = isExpanded ? boundShellHeight(height) : shellHeightClosed;

    return (
      <Fragment>
        <InfoModal
          show={showInfoModal}
          hideInfoModal={this.hideInfoModal.bind(this)}
        />
        <div
          data-testid="shell-section"
          className={compassShellStyles}
          style={{ height: renderedHeight }}
          id="content"
          onClick={this.focusEditor.bind(this)}
        >
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
            onShellToggleClicked={() => isExpanded
              ? this.updateHeight(shellHeightClosed)
              : this.updateHeight(prevHeight)
            }
            isOperationInProgress={isOperationInProgress}
            showInfoModal={() => this.setState({ showInfoModal: true })}
          />
          <div
            data-testid="shell-content"
            className={cx(
              compassShellContainerStyles, {
                [compassShellContainerVisibleStyles]: isExpanded
              }
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

export default connect(
  (state) => ({
    emitShellPluginOpened: () => {
      if (state.appRegistry && state.appRegistry.globalAppRegistry) {
        state.appRegistry.globalAppRegistry.emit('compass:compass-shell:opened');
      }
    },
    runtime: state.runtime ? state.runtime.runtime : null
  })
)(CompassShell);
