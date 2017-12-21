const React = require('react');
const path = require('path');
const ipc = require('hadron-ipc');
const os = require('os');
const _ = require('lodash');
const pkg = require('../../../../../package.json');

/**
 * The path to the intercom html to load in the webview.
 */
const INTERCOM_HTML = path.join(__dirname, 'intercom.html');

/**
 * The compass intercom key.
 */
const INTERCOM_KEY = 'p57suhg7';

/**
 * Component that handles enabling/disabling intercom in a webview.
 */
class Intercom extends React.Component {

  /**
   * Instantiate the component.
   *
   * @param {Object} props - The props.
   */
  constructor(props) {
    super(props);
    this.state = { enabled: global.hadronApp.preferences.enableFeedbackPanel };
    this.receive = this.receiveMessage.bind(this);
  }

  componentDidMount() {
    global.hadronApp.preferences.on('change:enableFeedbackPanel', this.toggleIntercom.bind(this));
    ipc.on('window:show-intercom-panel', this.showIntercom.bind(this));
    if (this.state.enabled) {
      this.addListener();
    }
  }

  componentWillUnmount() {
    this.removeListener();
  }

  getAppData() {
    const user = global.hadronApp.user;
    return {
      app_id: INTERCOM_KEY,
      user_id: user.id,
      created_at: Math.floor(user.createdAt.getTime() / 1000),
      name: user.name,
      email: user.email,
      twitter: user.twitter,
      app_name: pkg.productName,
      app_version: pkg.version,
      app_stage: process.env.NODE_ENV,
      host_arch: os.arch(),
      host_cpu_cores: os.cpus().length,
      host_cpu_freq_mhz: _.get(os.cpus()[0], 'speed', 'unknown'),
      host_total_memory_gb: os.totalmem() / 1024 / 1024 / 1024,
      host_free_memory_gb: os.freemem() / 1024 / 1024 / 1024
    };
  }

  addListener() {
    window.addEventListener('message', this.receive, false);
  }

  removeListener() {
    window.removeEventListener('message', this.receive);
  }

  receiveMessage(evt) {
    if (evt.data.action === 'intercom-frame-ready') {
      this.bootIntercom();
    }
  }

  bootIntercom() {
    if (this.state.enabled) {
      this.refs.intercomFrame.contentWindow.postMessage(
        { action: 'boot', data: this.getAppData() },
        '*'
      );
    }
  }

  showIntercom() {
    if (this.state.enabled) {
      this.refs.intercomFrame.contentWindow.postMessage({ action: 'show' }, '*');
    }
  }

  shutdownIntercom() {
    this.refs.intercomFrame.contentWindow.postMessage({ action: 'shutdown' }, '*');
  }

  toggleIntercom(preferences, enabled) {
    if (enabled) {
      this.addListener();
    } else {
      this.removeListener();
      this.shutdownIntercom();
    }
    this.setState({ enabled: enabled });
  }

  /**
   * Component for rendering the Intercom chat.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    if (this.state.enabled) {
      return (
        <iframe allowFullScreen ref="intercomFrame" className="intercom-iframe" src={INTERCOM_HTML}>
        </iframe>
      );
    }
    return (<div></div>);
  }
}

Intercom.displayName = 'Intercom';

module.exports = Intercom;
