import { css } from '@mongodb-js/compass-components';
import React from 'react';

const collectionHeaderActionsReadonlyStyles = css({
  margin: '0px 8px',
  marginLeft: 'auto',
  fontSize: '16px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  alignItems: 'inherit',
});

type ViewInformationProps = {
  sourceName: string;
};

const ViewInformation: React.FunctionComponent<ViewInformationProps> = ({
  sourceName,
}: ViewInformationProps) => {
  return (
    <div
      data-testid="collection-view-on"
      className={collectionHeaderActionsReadonlyStyles}
      title={sourceName}
    >
      view on: {sourceName}
    </div>
  );
};

export default ViewInformation;
