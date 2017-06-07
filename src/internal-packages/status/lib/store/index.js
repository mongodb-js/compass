const Reflux = require('reflux');
const StatusAction = require('../action');
const StateMixin = require('reflux-state-mixin');
const _ = require('lodash');

const debug = require('debug')('mongodb-compass:stores:status');

/**
 * Status store. The store object consists of the following options:
 *
 * @param {Boolean} visible       show/hide entire status view
 * @param {Boolean} progressbar   show/hide progress bar
 * @param {Number}  progress      progress bar width in percent 0-100
 * @param {Boolean} modal         activate/deactivate modal
 * @param {Boolean} animation     show/hide animation
 * @param {String}  message       message to show, '' disables message
 * @param {View}    subview       subview to show, or `null`
 * @param {Boolean} sidebar       show/hide static sidebar
 */

const StatusStore = Reflux.createStore({
  // adds a state to the store, similar to React.Component's state
  mixins: [StateMixin.store],
  listenables: StatusAction,

  init() {
    this._trickleTimer = null;
  },

  /**
   * Initialize the status store.
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      visible: false,
      progressbar: false,
      progress: 0,
      modal: false,
      animation: false,
      message: '',
      subview: null,
      sidebar: false,
      trickle: false
    };
  },

  showProgressBar() {
    this.setState({
      visible: true,
      progressbar: true
    });
  },

  showIndeterminateProgressBar() {
    this.disableProgressTrickle();
    this.setState({
      visible: true,
      progressbar: true,
      progress: 100,
      trickle: false
    });
  },

  hideProgressBar() {
    this.disableProgressTrickle();
    this.setState({
      progressbar: false
    });
  },

  configure(options) {
    // `trickle` is the only option with a "side-effect", all other
    // state variables are handled by the status component.
    if (options.trickle) {
      this.enableProgressTrickle();
    } else {
      this.disableProgressTrickle();
    }
    this.setState(options);
  },

  setProgressValue(value) {
    this.setState({
      visible: true,
      progress: value
    });
  },

  incProgressValue(value) {
    this.setState({
      visible: true,
      progress: this.state.value + value
    });
  },

  enableProgressTrickle() {
    if (this._trickleTimer) {
      return;
    }
    this._trickleTimer = setInterval(() => {
      const newValue = Math.min(98, this.state.progress + 1);
      this.setState.call(this, {
        progress: newValue
      });
    }, 600);
    this.setState({
      trickle: true
    });
  },

  disableProgressTrickle() {
    if (this._trickleTimer !== null) {
      clearInterval(this._trickleTimer);
      this._trickleTimer = null;
    }
    this.setState({
      trickle: false
    });
  },

  setMessage(msg) {
    this.setState({
      visible: true,
      message: msg
    });
  },

  clearMessage() {
    this.setState({
      message: ''
    });
  },

  showAnimation() {
    this.setState({
      visible: true,
      animation: true
    });
  },

  hideAnimation() {
    this.setState({
      animation: false
    });
  },

  showStaticSidebar() {
    this.setState({
      visible: true,
      sidebar: true
    });
  },

  hideStaticSidebar() {
    this.setState({
      sidebar: false
    });
  },

  setSubview(view) {
    this.setState({
      subview: view
    });
  },

  onClearSubview() {
    this.setState({
      subview: null
    });
  },

  enableModal() {
    this.setState({
      modal: true
    });
  },

  disableModal() {
    this.setState({
      modal: false
    });
  },

  hide() {
    this.disableProgressTrickle();
    this.setState(this.getInitialState());
  },

  done() {
    this.disableProgressTrickle();
    this.setState({
      progress: 100,
      animation: false,
      message: '',
      subview: null
    });
    _.delay(() => {
      this.hide();
    }, 700);
  },

  storeDidUpdate(prevState) {
    debug('status store changed from', prevState, 'to', this.state);
  }
});

module.exports = StatusStore;
