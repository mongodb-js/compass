import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import StatusActions from 'actions';
import delay from 'lodash.delay';

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
  mixins: [StateMixin.store],
  listenables: StatusActions,

  onActivated(appRegistry) {
    appRegistry.on('compass:status:show-progress-bar', this.showProgressBar.bind(this));
    appRegistry.on('compass:status:show-indeterminate-progress-bar', this.showIndeterminateProgressBar.bind(this));
    appRegistry.on('compass:status:hide-progress-bar', this.hideProgressBar.bind(this));
    appRegistry.on('compass:status:set-progress-value', this.setProgressValue.bind(this));
    appRegistry.on('compass:status:inc-progress-value', this.incProgressValue.bind(this));
    appRegistry.on('compass:status:enable-progress-trickle', this.enableProgressTrickle.bind(this));
    appRegistry.on('compass:status:disable-progress-trickle', this.disableProgressTrickle.bind(this));
    appRegistry.on('compass:status:set-message', this.setMessage.bind(this));
    appRegistry.on('compass:status:clear-message', this.clearMessage.bind(this));
    appRegistry.on('compass:status:show-animation', this.showAnimation.bind(this));
    appRegistry.on('compass:status:hide-animation', this.hideAnimation.bind(this));
    appRegistry.on('compass:status:show-static-sidebar', this.showStaticSidebar.bind(this));
    appRegistry.on('compass:status:hide-static-sidebar', this.hideStaticSidebar.bind(this));
    appRegistry.on('compass:status:set-subview', this.setSubview.bind(this));
    appRegistry.on('compass:status:set-subview-store', this.setSubviewStore.bind(this));
    appRegistry.on('compass:status:set-subview-actions', this.setSubviewActions.bind(this));
    appRegistry.on('compass:status:clear-subview', this.clearSubview.bind(this));
    appRegistry.on('compass:status:enable-modal', this.enableModal.bind(this));
    appRegistry.on('compass:status:disable-modal', this.disableModal.bind(this));
    appRegistry.on('compass:status:configure', this.configure.bind(this));
    appRegistry.on('compass:status:hide', this.hide.bind(this));
    appRegistry.on('compass:status:done', this.done.bind(this));
    appRegistry.on('compass:status:set-global-app-registry', this.setGlobalAppRegistry.bind(this));
    this.setGlobalAppRegistry(appRegistry);
  },

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
      subviewStore: null,
      subviewActions: null,
      sidebar: true,
      trickle: false,
      globalAppRegistry: null
    };
  },

  setGlobalAppRegistry(appRegistry) {
    this.setState({
      globalAppRegistry: appRegistry
    });
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
      progress: this.state.progress + value
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

  setSubviewStore(store) {
    this.setState({
      subviewStore: store
    });
  },

  setSubviewActions(actions) {
    this.setState({
      subviewActions: actions
    });
  },

  clearSubview() {
    this.setState({
      subview: null,
      subviewStore: null,
      subviewActions: null
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
      subview: null,
      subviewStore: null,
      subviewActions: null
    });
    delay(() => {
      this.hide();
    }, 700);
  }
});

export default StatusStore;
export { StatusStore };
