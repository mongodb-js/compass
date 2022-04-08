import { css, spacing } from '@mongodb-js/compass-components';
import React from 'react';

const collectionHeaderActionsReadonlyStyles = css({
  margin: `0px ${spacing[2]}px`,
  marginLeft: 'auto',
  fontSize: spacing[3],
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
