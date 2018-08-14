import { InputGroup, FormControl } from 'react-bootstrap';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import {
  setCurrentResult,
  dispatchStopFind,
  setTotalResults,
  setSearchTerm,
  toggleStatus,
  dispatchFind } from 'modules';


import styles from './compass-find-in-page.less';

const KEYCODE_ENTER = 13;
const KEYCODE_ESC = 27;

class CompassFindInPage extends PureComponent {
  static displayName = 'CompassFindInPageComponent';

  static propTypes = {
    dispatchStopFind: PropTypes.func.isRequired,
    setSearchTerm: PropTypes.func.isRequired,
    dispatchFind: PropTypes.func.isRequired,
    toggleStatus: PropTypes.func.isRequired,
    searchTerm: PropTypes.string.isRequired,
    searching: PropTypes.bool.isRequired,
    enabled: PropTypes.bool.isRequired,
    currentResult: PropTypes.number,
    totalResults: PropTypes.number
  };

  componentDidMount() {
    // need to add the event listener to window, since when we tab throught the
    // results, the focus is not on the input field
    window.addEventListener('keydown', this.onKeyDown);
  }

  componentDidUpdate() {
    // focus this element on initial cmd-f call from main app
    const el = document.querySelector('#find-in-page-input');
    if (el) el.focus();
  }

  componentWillUnmount() {
    // remove the event listener once we leave the component
    window.removeEventListener('keydown');
  }

  onKeyDown = (e) => {
    if (e.keyCode === KEYCODE_ESC) {
      this.props.toggleStatus();
      this.props.dispatchStopFind();
      this.props.setSearchTerm('');
    }

    // initial submit + used for tabbing through results
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
    this.props.toggleStatus();
  }

  // TODO: allow to use buttons to navigate search results
  // findPrev = () => {
  //   const val = document.querySelector('#find-in-page-input').value;
  //   if (!val || val === '') return this.props.dispatchStopFind();
  //   console.log('FIND PREF', val)

  //   this.props.dispatchFind(val, false, !this.props.searching);
  // }

  // findNext = () => {
  //   const val = document.querySelector('#find-in-page-input').value;
  //   if (!val || val === '') return this.props.dispatchStopFind();
  //   console.log('FIND NEXT', val)

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

    if (this.props.enabled) {
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
    return (<div></div>);
  }
}

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => ({
  currentResult: state.currentResult,
  totalResults: state.totalResults,
  searchTerm: state.searchTerm,
  searching: state.searching,
  enabled: state.enabled
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedCompassFindInPage = connect(
  mapStateToProps,
  {
    setCurrentResult,
    dispatchStopFind,
    setTotalResults,
    setSearchTerm,
    dispatchFind,
    toggleStatus
  },
)(CompassFindInPage);

export default MappedCompassFindInPage;
