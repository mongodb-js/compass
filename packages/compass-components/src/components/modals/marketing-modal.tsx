import React from 'react';
import {
  Body,
  MarketingModal as LeafyGreenMarketingModal,
} from '../leafygreen';
import { withStackedComponentStyles } from '../../hooks/use-stacked-component';

export type MarketingModalProps = Omit<
  React.ComponentProps<typeof LeafyGreenMarketingModal>,
  'backdropClassName'
>;

function MarketingModal({
  children,
  ...props
}: MarketingModalProps): React.ReactElement {
  return (
    <LeafyGreenMarketingModal {...props}>
      <Body as="div">{children}</Body>
    </LeafyGreenMarketingModal>
  );
}

export default withStackedComponentStyles(MarketingModal);
