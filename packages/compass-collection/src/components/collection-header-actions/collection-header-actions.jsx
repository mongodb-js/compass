import React from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonSize } from '@mongodb-js/compass-components';

import ViewInformation from './view-information';

import styles from './collection-header-actions.module.less';

function CollectionHeaderActions({
  editViewName,
  isReadonly,
  onEditViewClicked,
  onReturnToViewClicked,
  sourceName
}) {
  return (
    <div className={styles['collection-header-actions']}>
      {isReadonly && sourceName && (
        <ViewInformation sourceName={sourceName} />
      )}
      {isReadonly && sourceName && !editViewName && (
        <Button
          size={ButtonSize.XSmall}
          onClick={onEditViewClicked}
        >EDIT VIEW</Button>
      )}
      {editViewName && (
        <Button
          className={styles['collection-header-actions-return-to-view']}
          size={ButtonSize.XSmall}
          onClick={onReturnToViewClicked}
        >&lt; Return to View</Button>
      )}
    </div>
  );
}

CollectionHeaderActions.propTypes = {
  editViewName: PropTypes.string,
  isReadonly: PropTypes.bool.isRequired,
  onEditViewClicked: PropTypes.func.isRequired,
  onReturnToViewClicked: PropTypes.func.isRequired,
  sourceName: PropTypes.string
};

export default CollectionHeaderActions;
