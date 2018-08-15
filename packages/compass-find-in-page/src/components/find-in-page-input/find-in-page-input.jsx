import { InputGroup, FormControl } from 'react-bootstrap';
import React, { PureComponent } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import styles from './find-in-page-input.less';

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
    // currentResult: PropTypes.number,
    // totalResults: PropTypes.number
  };

  componentDidMount() {
    const el = document.querySelector('#find-in-page-input');
    if (el) el.focus();
    window.addEventListener('keydown', this.onKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  onKeyDown = (e) => {
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
  }

  handleChange = (e) => {
    this.props.setSearchTerm(e.target.value);
  }

  handleClose = () => {
    this.props.dispatchStopFind();
    this.props.setSearchTerm('');
    this.props.toggleStatus();
  }

  // TODO: allow to use buttons to navigate search results
  // findPrev = () => {
  //   const val = document.querySelector('#find-in-page-input').value;
  //   if (!val || val === '') return this.props.dispatchStopFind();

  //   this.props.dispatchFind(val, false, !this.props.searching);
  // }

  // findNext = () => {
  //   const val = document.querySelector('#find-in-page-input').value;
  //   if (!val || val === '') return this.props.dispatchStopFind();

  //   this.props.dispatchFind(val, true, true);
  // }

  // TODO: send results down to this component from electron's web content
  // found-in-page event to show current and total results
  // renderResultDiv = () => {
  //   return (
  //     <label className={classnames(styles['find-in-page-form-group-label'])}>
  //       {this.props.currentResult}/{this.props.totalResults}
  //     </label>
  //   );
  // }

  /**
   * Render CompassFindInPage component. If the component is not enabled,
   * return an empty div.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    // const resultDiv =
    //   (!this.props.currentResult || !this.props.totalResults)
    //     ? '' : this.renderResultDiv();
    return (
      <div className={classnames(styles.wrapper)}>
        <span className={classnames(styles['wrapper-span'])}>Use (Shift+) Enter to navigate results.</span>
        <div className={classnames(styles.find)}>
          <form
            name="find-in-page"
            data-test-id="find-in-page"
            className={classnames(styles['find-in-page'])}>
            <InputGroup className={classnames(styles['find-in-page-input'])}bsSize="small">
              <FormControl
                key="findInPage"
                type="text"
                id="find-in-page-input"
                onChange={this.handleChange}
                value={this.props.searchTerm}/>
                {/* resultDiv */}
              { /* <InputGroup.Addon onClick={this.findPrev}>
                <i className="fa fa-angle-up"></i>
              </InputGroup.Addon>
              <InputGroup.Addon onClick={this.findNext}>
                <i className="fa fa-angle-down"></i>
              </InputGroup.Addon> */}
            </InputGroup>
          </form>
          <div className={classnames(styles['find-close'])} onClick={this.handleClose}>
            <div className={classnames(styles['find-close-box'])}>
              <span>&times;</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default FindInPageInput;
