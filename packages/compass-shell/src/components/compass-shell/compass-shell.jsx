import React, { Component, Fragment } from 'react';
import classnames from 'classnames';
import styles from './compass-shell.less';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Resizable } from 're-resizable';

import { Shell } from '@mongosh/browser-repl';

import InfoModal from '../info-modal';
import ResizeHandle from '../resize-handle';
import ShellHeader from '../shell-header';

const resizeableDirections = {
  top: false, // This property is controlled in the component.
  right: false,
  bottom: false,
  left: false,
  topRight: false,
  bottomRight: false,
  bottomLeft: false,
  topLeft: false
};

const defaultShellHeightClosed = 24;
const defaultShellHeightOpened = 240;

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
      initialHistory: this.props.historyStorage ? null : [],
      isExpanded: !!this.props.isExpanded,
      isOperationInProgress: false
    };
  }

  componentDidMount() {
    this.loadHistory();
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

  lastOpenHeight = defaultShellHeightOpened;
  resizableRef = null;

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
      // Apply bounds to height to ensure it's always visible to the user.
      const heightToResume = Math.max(60, this.resizableRef.size.height);
      this.lastOpenHeight = heightToResume;

      this.resizableRef.updateSize({
        width: '100%',
        height: defaultShellHeightClosed
      });
    } else {
      this.props.emitShellPluginOpened();

      this.resizableRef.updateSize({
        width: '100%',
        height: Math.min(this.lastOpenHeight, window.innerHeight - 40)
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
        <Resizable
          className={styles['compass-shell']}
          defaultSize={{
            width: '100%',
            height: defaultShellHeightClosed
          }}
          id="content"
          minHeight={defaultShellHeightClosed}
          maxHeight="95vh"
          enable={{
            ...resizeableDirections,
            top: isExpanded
          }}
          ref={c => { this.resizableRef = c; }}
          handleComponent={{
            top: <ResizeHandle />,
          }}
        >
          <ShellHeader
            isExpanded={isExpanded}
            onShellToggleClicked={this.shellToggleClicked}
            isOperationInProgress={isOperationInProgress}
          />
          <div
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
        </Resizable>
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
