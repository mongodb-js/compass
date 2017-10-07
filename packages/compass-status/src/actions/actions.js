import Reflux from 'reflux';

const StatusActions = Reflux.createActions({
  /**
   * shows the progress bar.
   */
  showProgressBar: { sync: false },
  /**
   * shows an indeterminate progress bar at 100 percent.
   */
  showIndeterminateProgressBar: { sync: false },
  /**
   * hides the progress bar.
   */
  hideProgressBar: { sync: false },
  /**
   * sets the value of the progres bar.
   *
   * @param {Number} value   the value, must be between 0 and 100.
   */
  setProgressValue: { sync: false },
  /**
   * increases the value of the progres bar.
   *
   * @param {Number} value   increase by value.
   */
  incProgressValue: { sync: false },
  /**
   * enable trickle: progress bar randomly advances a few percentage points
   * every second to indicate progress.
   */
  enableProgressTrickle: { sync: false },
  /**
   * disable trickle.
   */
  disableProgressTrickle: { sync: false },
  /**
   * sets a message that is shown on the screen above the loading animation.
   *
   * @param {String} message    the message to show
   */
  setMessage: { sync: false },
  /**
   * clears and removes the message.
   */
  clearMessage: { sync: false },
  /**
   * shows loading animation in the center of the screen.
   */
  showAnimation: { sync: false },
  /**
   * hides loading animation.
   */
  hideAnimation: { sync: false },
  /**
   * shows a static gray sidebar in the background. This is useful when
   * no other content is on the screen yet (e.g. when connecting to a mongod)
   * so that the message/loading animation look centered.
   */
  showStaticSidebar: { sync: false },
  /**
   * hide static gray sidebar.
   */
  hideStaticSidebar: { sync: false },
  /**
   * set a custom subview that is shown below the loading animation. For example,
   * the schema view sets a subview to indicate longer than usual parsing.
   *
   * @param {View} subview    the subview to render.
   */
  setSubview: { sync: false },
  /**
   * clears the custom subview.
   */
  clearSubview: { sync: false },
  /**
   * when enabled, overlays the screen with a transparent div, so that no other
   * interaction can take place.
   */
  enableModal: { sync: false },
  /**
   * TODO: This modal flag does not currently work, it needs to change the style
   * into say a popup box so it's clear what the user can/cannot click on.
   * disables the modal transparent div.
   */
  disableModal: { sync: false },
  /**
   * custom configuration to set all the options above in a single call.
   *
   * @param {Object}  options          options to configure, see below:
   *
   * @param {Boolean} options.visible       show/hide entire status view
   * @param {Boolean} options.progressbar   show/hide progress bar
   * @param {Number}  options.width         progress bar width 0-100
   * @param {Boolean} options.modal         activate/deactivate modal
   * @param {Boolean} options.animation     show/hide animation
   * @param {String}  options.message       message to show, '' disables message
   * @param {View}    options.subview       subview to show, or `null`
   * @param {Boolean} options.sidebar       show/hide static sidebar
   */
  configure: { sync: false },
  /**
   * hide all status components (progress bar, message, animation, sidebar).
   * Use when loading was interrupted.
   */
  hide: { sync: true },
  /**
   * like `hide()` but animates the progress bar to 100% before hiding, so that
   * the user gets feedback of success. Use when loading is complete.
   */
  done: { sync: false }
});

export default StatusActions;
export { StatusActions };
