import React from 'react';
import {
  Body,
  MarketingModal as LeafyGreenMarketingModal,
} from '../leafygreen';
import { withStackedComponentStyles } from '../../hooks/use-stacked-component';

function MarketingModal({
  children,
  ...props
}: React.ComponentProps<typeof LeafyGreenMarketingModal>): React.ReactElement {
  return (
    <LeafyGreenMarketingModal {...props}>
      <Body as="div">{children}</Body>
    </LeafyGreenMarketingModal>
  );
}

export default withStackedComponentStyles(MarketingModal);
