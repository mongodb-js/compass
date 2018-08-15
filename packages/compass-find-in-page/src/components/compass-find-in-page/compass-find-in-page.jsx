import FindInPageInput from 'components/find-in-page-input';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  dispatchStopFind,
  setSearchTerm,
  toggleStatus,
  dispatchFind } from 'modules';

class CompassFindInPage extends PureComponent {
  static displayName = 'CompassFindInPageComponent';

  static propTypes = {
    enabled: PropTypes.bool.isRequired
  };

  render() {
    const input = this.props.enabled
      ? <FindInPageInput { ...this.props } />
      : null;

    return (
      <div data-test-id="find-in-page">
        {input}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  // currentResult: state.currentResult,
  // totalResults: state.totalResults,
  searchTerm: state.searchTerm,
  searching: state.searching,
  enabled: state.enabled
});

const MappedCompassFindInPage = connect(
  mapStateToProps,
  {
    // setCurrentResult,
    dispatchStopFind,
    // setTotalResults,
    setSearchTerm,
    dispatchFind,
    toggleStatus
  },
)(CompassFindInPage);

export default MappedCompassFindInPage;
