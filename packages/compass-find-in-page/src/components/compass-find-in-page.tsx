import React from 'react';
import { connect } from 'react-redux';

import FindInPageInput from './find-in-page-input';
import {
  dispatchStopFind,
  setSearchTerm,
  toggleStatus,
  dispatchFind
} from '../modules';

type CompassFindInPageProps = {
  enabled: boolean;
};

const CompassFindInPage: React.FunctionComponent<CompassFindInPageProps> = ({
  enabled
}) => {
  return (
    <div data-test-id="find-in-page">
      {enabled && <FindInPageInput />}
    </div>
  );
}

const mapStateToProps = state => ({
  searchTerm: state.searchTerm,
  searching: state.searching,
  enabled: state.enabled
});

const MappedCompassFindInPage = connect(mapStateToProps, {
  dispatchStopFind,
  setSearchTerm,
  dispatchFind,
  toggleStatus
})(CompassFindInPage);

export default MappedCompassFindInPage;
