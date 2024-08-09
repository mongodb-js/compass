import React from 'react';
import { connect } from '../stores/context';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@mongodb-js/compass-components';
import type { RootState } from '../stores/query-bar-store';
import { getQueryAttributes, isQueryEqual } from '../utils';
import { mapFormFieldsToQuery } from '../utils/query';
import { SavedQuery } from '@mongodb-js/compass-editor';

const starStyles = css({
  display: 'flex',
  alignItems: 'center',
  marginRight: `${spacing[100]}px`,
  '&:hover': {
    color: '#FFC0CB',
  },
});

const FilledStarIcon: React.FunctionComponent = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.53815 1.10999C7.70895 0.699342 8.29068 0.69934 8.46147 1.10999L9.99856 4.80558C10.0705 4.9787 10.2333 5.09699 10.4202 5.11197L14.4099 5.43182C14.8533 5.46736 15.033 6.02062 14.6953 6.30995L11.6555 8.91381C11.5131 9.03578 11.451 9.22717 11.4945 9.40954L12.4231 13.3028C12.5263 13.7354 12.0557 14.0773 11.6762 13.8455L8.26044 11.7592C8.10043 11.6615 7.89919 11.6615 7.73919 11.7592L4.32344 13.8455C3.94389 14.0773 3.47327 13.7354 3.57646 13.3028L4.50515 9.40954C4.54865 9.22717 4.48647 9.03578 4.34407 8.91381L1.30434 6.30995C0.966568 6.02062 1.14633 5.46736 1.58966 5.43182L5.57936 5.11197C5.76626 5.09699 5.92906 4.9787 6.00107 4.80558L7.53815 1.10999Z"
      fill="#5C6C75"
    />
  </svg>
);

const OutlinedStarIcon: React.FunctionComponent = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.53815 1.10999C7.70895 0.699342 8.29068 0.69934 8.46147 1.10999L9.99856 4.80558C10.0705 4.9787 10.2333 5.09699 10.4202 5.11197L14.4099 5.43182C14.8533 5.46736 15.033 6.02062 14.6953 6.30995L11.6555 8.91381C11.5131 9.03578 11.451 9.22717 11.4945 9.40954L12.4231 13.3028C12.5263 13.7354 12.0557 14.0773 11.6762 13.8455L8.26044 11.7592C8.10043 11.6615 7.89919 11.6615 7.73919 11.7592L4.32344 13.8455C3.94389 14.0773 3.47327 13.7354 3.57646 13.3028L4.50515 9.40954C4.54865 9.22717 4.48647 9.03578 4.34407 8.91381L1.30434 6.30995C0.966568 6.02062 1.14633 5.46736 1.58966 5.43182L5.57936 5.11197C5.76626 5.09699 5.92906 4.9787 6.00107 4.80558L7.53815 1.10999Z"
      fill="none"
      stroke="#5C6C75"
    />
  </svg>
);

type StarQueryProps = {
  isFavorite: boolean;
  query: SavedQuery;
};

const StarQuery: React.FunctionComponent<StarQueryProps> = ({ isFavorite }) => {
  return (
    <div className={starStyles}>
      {isFavorite ? <FilledStarIcon /> : <OutlinedStarIcon />}
    </div>
  );
};

const mapStateToProps = (state: RootState) => {
  const { fields, favoriteQueries } = state.queryBar;
  const query = mapFormFieldsToQuery(fields);
  const queryAttributes = getQueryAttributes(query);
  const isFavorite = favoriteQueries.some((favoriteQuery) =>
    isQueryEqual(getQueryAttributes(favoriteQuery), queryAttributes)
  );

  return {
    isFavorite: isFavorite,
    query: query,
  };
};

export default connect(mapStateToProps)(StarQuery);
