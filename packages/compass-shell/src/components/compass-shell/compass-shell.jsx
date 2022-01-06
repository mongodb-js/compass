import React, { Component, Fragment } from 'react';
import classnames from 'classnames';
import styles from './compass-shell.module.less';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Shell } from '@mongosh/browser-repl';
import { ResizeHandle, ResizeDirection } from '@mongodb-js/compass-components';

import InfoModal from '../info-modal';
import ShellHeader from '../shell-header';

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
    if (this.shellRef.current) {
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
          data-test-id="shell-section"
          className={styles['compass-shell']}
          style={{ height: renderedHeight }}
          id="content"
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
            data-test-id="shell-content"
            className={classnames(
              styles['compass-shell-shell-container'], {
                [styles['compass-shell-shell-container-visible']]: isExpanded
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
