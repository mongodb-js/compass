import React from 'react';
import {
  useHoverState,
  spacing,
  css,
  ItemActionControls,
} from '@mongodb-js/compass-components';
import { ROW_HEIGHT, type Actions } from './constants';
import {
  ItemContainer,
  ItemLabel,
  ItemWrapper,
  ItemButtonWrapper,
  ExpandButton,
} from './tree-item';
import { type NavigationItemActions } from './item-actions';

type NavigationBaseItemProps = {
  isActive: boolean;
  style: React.CSSProperties;

  name: string;
  icon: React.ReactNode;

  numVisibleActions: number;
  actions: NavigationItemActions;
  onAction: (action: Actions) => void;

  canExpand: boolean;
  isExpanded: boolean;
  onExpand: (toggle: boolean) => void;
};

const baseItemContainerStyles = css({
  height: ROW_HEIGHT,
});

const baseItemButtonWrapperStyles = css({
  height: ROW_HEIGHT,
  paddingRight: spacing[100],
});

const baseItemLabelStyles = css({
  marginLeft: spacing[200],
});

export const NavigationBaseItem = ({
  isActive,
  actions,
  name,
  style,
  icon,
  canExpand,
  isExpanded,
  numVisibleActions,
  onAction,
  onExpand,
}: NavigationBaseItemProps) => {
  const [hoverProps, isHovered] = useHoverState();
  return (
    <ItemContainer
      isActive={isActive}
      className={baseItemContainerStyles}
      {...hoverProps}
    >
      <ItemWrapper>
        <ItemButtonWrapper
          style={style}
          className={baseItemButtonWrapperStyles}
        >
          {canExpand && (
            <ExpandButton
              onClick={() => onExpand(!isExpanded)}
              isExpanded={isExpanded}
            ></ExpandButton>
          )}
          {icon}
          <ItemLabel className={baseItemLabelStyles} title={name}>
            {name}
          </ItemLabel>
        </ItemButtonWrapper>
        <ItemActionControls<Actions>
          onAction={onAction}
          isVisible={isActive || isHovered}
          data-testid="sidebar-navigation-item-actions"
          collapseToMenuThreshold={numVisibleActions}
          iconSize="small"
          actions={actions}
        ></ItemActionControls>
      </ItemWrapper>
    </ItemContainer>
  );
};
