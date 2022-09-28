import React from 'react';
import { connect } from 'react-redux';

import FindInPageInput from './find-in-page-input';
import {
  dispatchStopFind,
  setSearchTerm,
  toggleStatus,
  dispatchFind,
} from '../modules';
import type { State } from '../modules';

type CompassFindInPageProps = {
  enabled: boolean;
  dispatchStopFind: () => void;
  setSearchTerm: (searchTerm: string) => void;
  dispatchFind: (
    searchTerm: string,
    isDirectionInversed: boolean,
    searching: boolean
  ) => void;
  toggleStatus: () => void;
  searchTerm: string;
  searching: boolean;
};

const CompassFindInPage: React.FunctionComponent<CompassFindInPageProps> = ({
  enabled,
  dispatchStopFind,
  setSearchTerm,
  dispatchFind,
  toggleStatus,
  searchTerm,
  searching,
}) => {
  return (
    <div data-testid="find-in-page">
      {enabled && (
        <FindInPageInput
          dispatchStopFind={dispatchStopFind}
          setSearchTerm={setSearchTerm}
          dispatchFind={dispatchFind}
          toggleStatus={toggleStatus}
          searchTerm={searchTerm}
          searching={searching}
        />
      )}
    </div>
  );
};

const mapStateToProps = (state: State) => ({
  searchTerm: state.searchTerm,
  searching: state.searching,
  enabled: state.enabled,
});

const MappedCompassFindInPage = connect(mapStateToProps, {
  dispatchStopFind,
  setSearchTerm,
  dispatchFind,
  toggleStatus,
})(CompassFindInPage);

export default MappedCompassFindInPage;
