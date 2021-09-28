import React, { Component, Fragment } from 'react';
import classnames from 'classnames';
import styles from './compass-shell.module.less';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Shell } from '@mongosh/browser-repl';
import { ResizeHandleHorizontal } from '@mongodb-js/compass-components';

import InfoModal from '../info-modal';
import ShellHeader from '../shell-header';

const defaultShellHeightOpened = 240;
const shellHeightClosed = 32;
const shellMinHeightOpened = 100;
const resizeControlIncrement = 10;

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
    isExpanded: PropTypes.bool,
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

    this.shellOutput = this.props.shellOutput || [];

    this.state = {
      height: props.isExpanded
        ? defaultShellHeightOpened
        : shellHeightClosed,
      initialHistory: this.props.historyStorage ? null : [],
      isExpanded: !!this.props.isExpanded,
      isOperationInProgress: false
    };
  }

  componentDidMount() {
    this.loadHistory();
    window.addEventListener('beforeunload', this.terminateRuntime);
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

  onResize = (newHeight) => {
    this.setState({
      height: newHeight
    });

    if (!this.state.isExpanded) {
      if (newHeight > shellMinHeightOpened) {
        // When we are not expanded and the user drags over a threshold we expand.
        this.props.emitShellPluginOpened();
        this.setState({
          isExpanded: true
        });
      }
      return;
    }

    if (newHeight < shellMinHeightOpened) {
      // When we are expanded and the user drags under a threshold we collapse.
      this.lastOpenHeight = shellMinHeightOpened;

      this.setState({
        isExpanded: false
      });
      return;
    }
  }

  terminateRuntime = () => {
    if (this.props.runtime) {
      this.props.runtime.terminate();
    }
  }

  lastOpenHeight = defaultShellHeightOpened;

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

  shellToggleClicked = () => {
    if (this.state.isExpanded) {
      this.lastOpenHeight = boundShellHeight(this.state.height);
      this.setState({
        height: shellHeightClosed
      });
    } else {
      this.props.emitShellPluginOpened();

      this.setState({
        height: boundShellHeight(this.lastOpenHeight)
      });
    }

    this.setState({
      isExpanded: !this.state.isExpanded
    });
  }

  /**
   * Render CompassShell component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const {
      isExpanded,
      isOperationInProgress
    } = this.state;

    if (!this.props.runtime || !this.state.initialHistory) {
      return (<div />);
    }

    return (
      <Fragment>
        <InfoModal />
        <div
          data-test-id="shell-section"
          className={styles['compass-shell']}
          style={{
            height: isExpanded
              ? boundShellHeight(this.state.height)
              : shellHeightClosed
          }}
          id="content"
        >
          <ResizeHandleHorizontal
            onResize={this.onResize}
            step={resizeControlIncrement}
            height={this.state.height}
            minHeight={shellHeightClosed}
            maxHeight={getMaxShellHeight()}
          />
          <ShellHeader
            isExpanded={isExpanded}
            onShellToggleClicked={this.shellToggleClicked}
            isOperationInProgress={isOperationInProgress}
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
