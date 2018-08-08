import { FormGroup, InputGroup, FormControl } from 'react-bootstrap';
import { toggleStatus, stopFind, find } from 'modules';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import styles from './compass-find-in-page.less';

const KEYCODE_ENTER = 13;
const KEYCODE_ESC = 27;

class CompassFindInPage extends PureComponent {
  static displayName = 'CompassFindInPageComponent';

  // also need next result, and previous result as part of
  static propTypes = {
    toggleStatus: PropTypes.func.isRequired,
    stopFind: PropTypes.func.isRequired,
    enabled: PropTypes.bool.isRequired,
    find: PropTypes.func.isRequired
  };

  state = {
    searchTerm: ''
  }

  componentDidMount() {
    window.addEventListener('keydown', this.onKeyDown);
  }

  onKeyDown = (e) => {
    if (e.keyCode === KEYCODE_ESC) {
      this.props.toggleStatus();
      this.props.stopFind();
      document.querySelector('#find-in-page-input').value = '';
    }
    if (e.keyCode === KEYCODE_ENTER) {
      e.preventDefault();
      const back = e.shiftKey;
      const val = document.querySelector('#find-in-page-input').value;
      if (val === '') return this.props.stopFind();

      this.props.find(val, true, !back);
    }
  }

  handleChange = (e) => {
    e.preventDefault();
    this.setState({ searchTerm: e.target.value });
    console.log('VALUE', e.target.value);

    if (e.target.value === '') return this.props.stopFind();
    this.props.find(e.target.value, true, false);

    const el = document.querySelector('#find-in-page-input');
    el.focus();
  };

  findPrev = () => {
    const val = document.querySelector('#find-in-page-input').value;
    if (val === '') return this.props.stopFind();

    this.props.find(val, false, true);
  }

  findNext = () => {
    const val = document.querySelector('#find-in-page-input').value;
    if (val === '') return this.props.stopFind();

    this.props.find(val, true, true);
  }
  /**
   * Render CompassFindInPage component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    console.log('RERENDERING');
    if (this.props.enabled) {
      return (
        <div className={classnames(styles.find)}>
          <form
            name="find-in-page"
            data-test-id="find-in-page"
            className={classnames(styles['find-in-page'])}>
            <FormGroup className={classnames(styles['find-in-page-form-group'])}>
              <InputGroup bsSize="small">
                <FormControl
                  key="findInPage"
                  type="text"
                  id="find-in-page-input"
                  onChange={this.handleChange}
                  value={this.state.searchTerm}/>
                <InputGroup.Addon onClick={this.findPrev}>
                  <i className="fa fa-angle-up"></i>
                </InputGroup.Addon>
                <InputGroup.Addon onClick={this.findNext}>
                  <i className="fa fa-angle-down"></i>
                </InputGroup.Addon>
              </InputGroup>
            </FormGroup>
          </form>
          <div className={classnames(styles['find-close'])} onClick={this.props.toggleStatus}>
            <div className={classnames(styles['find-close-box'])}>
              <span>&times;</span>
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
  enabled: state.enabled
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedCompassFindInPage = connect(
  mapStateToProps,
  {
    toggleStatus,
    stopFind,
    find
  },
)(CompassFindInPage);

export default MappedCompassFindInPage;
