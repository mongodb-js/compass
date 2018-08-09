import { FormGroup, InputGroup, FormControl } from 'react-bootstrap';
import { toggleStatus } from 'modules';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import ipc from 'hadron-ipc';


import styles from './compass-find-in-page.less';

const KEYCODE_ENTER = 13;
const KEYCODE_ESC = 27;

class CompassFindInPage extends PureComponent {
  static displayName = 'CompassFindInPageComponent';

  // also need next result, and previous result as part of
  static propTypes = {
    toggleStatus: PropTypes.func.isRequired,
    enabled: PropTypes.bool.isRequired
  };

  // only use this state for input field
  state = {
    searchTerm: ''
  }

  componentDidMount() {
    window.addEventListener('keydown', this.onKeyDown);
  }

  onKeyDown = (e) => {
    if (e.keyCode === KEYCODE_ESC) {
      this.props.toggleStatus();
      this.dispatchStopFind();
      this.setState({ searchTerm: '' });
    }

    if (e.keyCode === KEYCODE_ENTER) {
      e.preventDefault();
      const back = e.shiftKey;
      const val = document.querySelector('#find-in-page-input').value;
      if (val === '') return this.dispatchStopFind();

      this.dispatchFind(val, true, !back);
    }
  }

  dispatchFind = (val, forward, findNext) => {
    const opts = {
      forward: forward,
      findNext: findNext
    };

    ipc.call('app:find-in-page', val, opts);
  }

  dispatchStopFind = () => {
    ipc.call('app:stop-find-in-page', 'clearSelection');
  }

  handleChange = (e) => {
    e.preventDefault();
    this.setState({ searchTerm: e.target.value });

    if (e.target.value === '') return this.dispatchStopFind();
    // don't use state to search, use actual e.target.value
    this.dispatchFind(e.target.value, true, false);

    const el = document.querySelector('#find-in-page-input');
    el.focus();
  }

  handleClose = () => {
    this.dispatchStopFind();
    this.props.toggleStatus();
  }

  findPrev = () => {
    const val = document.querySelector('#find-in-page-input').value;
    if (val === '') return this.dispatchStopFind();

    this.dispatchFind(val, false, true);
  }

  findNext = () => {
    const val = document.querySelector('#find-in-page-input').value;
    if (val === '') return this.dispatchStopFind();

    this.dispatchFind(val, true, true);
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
          <div className={classnames(styles['find-close'])} onClick={this.handleClose}>
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
    toggleStatus
  },
)(CompassFindInPage);

export default MappedCompassFindInPage;
