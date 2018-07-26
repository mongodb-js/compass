import { FormGroup, InputGroup, Glyphicon, FormControl } from 'react-bootstrap';
import { toggleStatus, find } from 'modules/find-in-page';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import styles from './compass-find-in-page.less';

class CompassFindInPage extends Component {
  static displayName = 'CompassFindInPageComponent';

  // also need next result, and previous result as part of
  static propTypes = {
    toggleStatus: PropTypes.func.isRequired,
    findInPage: PropTypes.object.isRequired,
    find: PropTypes.func.isRequired
  };

  state = {
    value: ''
  }

  handleChange = (e) => {
    this.setState({ value: e.target.value });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.find(this.state.value);
  }

  renderFind = () => {
    return (
      <div className={classnames(styles.find)}>
        <form
          name="find-in-page"
          data-test-id="find-in-page"
          onSubmit={this.handleSubmit}
          className={classnames(styles['find-in-page'])}>
          <FormGroup className={classnames(styles['find-in-page-form-group'])}>
            <InputGroup>
              <FormControl
                type="text"
                value={this.state.value}
                onChange={this.handleChange}/>
              <InputGroup.Addon>
                <Glyphicon glyph="glyphicon glyphicon-chevron-up"/>
              </InputGroup.Addon>
              <InputGroup.Addon>
                <Glyphicon glyph="glyphicon glyphicon-chevron-down"/>
              </InputGroup.Addon>
            </InputGroup>
          </FormGroup>
        </form>
        <span
          className={classnames(styles['find-close'])}
          onClick={this.props.toggleStatus}>
          &times;
        </span>
      </div>
    );
  }

  /**
   * Render CompassFindInPage component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    console.log('PROPS', this.props);
    const findDiv = this.props.findInPage.enabled ? this.renderFind() : null;
    return (
      <div>
        {findDiv}
      </div>
    );
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
  findInPage: state.findInPage
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedCompassFindInPage = connect(
  mapStateToProps,
  {
    toggleStatus,
    find
  },
)(CompassFindInPage);

export default MappedCompassFindInPage;
