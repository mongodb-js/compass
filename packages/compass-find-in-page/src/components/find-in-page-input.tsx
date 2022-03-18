import { TextInput, IconButton, Icon, Body } from '@mongodb-js/compass-components';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import styles from './find-in-page-input.module.less';

const KEYCODE_ENTER = 13;
const KEYCODE_ESC = 27;

class FindInPageInput extends PureComponent {
  static displayName = 'FindInPageInputComponent';

  static propTypes = {
    dispatchStopFind: PropTypes.func.isRequired,
    setSearchTerm: PropTypes.func.isRequired,
    dispatchFind: PropTypes.func.isRequired,
    toggleStatus: PropTypes.func.isRequired,
    searchTerm: PropTypes.string.isRequired,
    searching: PropTypes.bool.isRequired,
    enabled: PropTypes.bool.isRequired
  };

  componentDidMount() {
    const el = document.querySelector('#find-in-page-input');
    if (el) el.focus();
    window.addEventListener('keydown', this.onKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  onKeyDown = e => {
    if (e.keyCode === KEYCODE_ESC) {
      this.handleClose();
    }

    if (e.keyCode === KEYCODE_ENTER) {
      e.preventDefault();
      const val = document.querySelector('#find-in-page-input').value;
      if (!val || val === '') return this.props.dispatchStopFind();

      const back = e.shiftKey;
      this.props.dispatchFind(val, !back, this.props.searching);
    }
  };

  handleChange = e => {
    this.props.setSearchTerm(e.target.value);
  };

  handleClose = () => {
    this.props.dispatchStopFind();
    this.props.setSearchTerm('');
    this.props.toggleStatus();
  };

  /**
   * Render CompassFindInPage component. If the component is not enabled,
   * return an empty div.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={styles.wrapper}>
        <Body
          className={styles['wrapper-span']}
        >
          Use (Shift+) Enter to navigate results.
        </Body>
        <div className={styles.find}>
          <form
            name="find-in-page"
            data-test-id="find-in-page"
            className={styles['find-in-page']}
          >
            <TextInput
              type="text"
              id="find-in-page-input"
              onChange={this.handleChange}
              value={this.props.searchTerm}
            />
          </form>
          <IconButton
            className={styles['find-close']}
            aria-label="Close find box"
            onClick={this.handleClose}
          >
            <Icon
              glyph="X"
              role="presentation"
            />
          </IconButton>
        </div>
      </div>
    );
  }
}

export default FindInPageInput;
