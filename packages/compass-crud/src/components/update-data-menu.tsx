import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Icon,
  Button,
  Tooltip,
  css,
  WorkspaceContainer,
} from '@mongodb-js/compass-components';
import { DOCUMENT_NARROW_ICON_BREAKPOINT } from '../constants/document-narrow-icon-breakpoint';

type UpdateMenuButtonProps = {
  isWritable: boolean;
  onClick: () => void;
};

const hiddenOnNarrowStyles = css({
  [`@container ${WorkspaceContainer.toolbarContainerQueryName} (width < ${DOCUMENT_NARROW_ICON_BREAKPOINT})`]:
    {
      display: 'none',
    },
});

const UpdateMenuButton: React.FunctionComponent<UpdateMenuButtonProps> = ({
  isWritable,
  onClick,
}) => {
  const { t } = useTranslation('compassCrud');
  return (
    <Button
      disabled={!isWritable}
      value={t('updateButton')}
      size="xsmall"
      onClick={onClick}
      leftGlyph={<Icon glyph="Edit"></Icon>}
      data-testid="crud-update"
      title={t('updateButton')}
    >
      <span className={hiddenOnNarrowStyles}>{t('updateButton')}</span>
    </Button>
  );
};

type UpdateMenuProps = UpdateMenuButtonProps & {
  disabledTooltip: string;
};

const UpdateMenu: React.FunctionComponent<UpdateMenuProps> = ({
  isWritable,
  onClick,
  disabledTooltip,
}) => {
  if (isWritable) {
    return (
      <UpdateMenuButton isWritable={true} onClick={onClick}></UpdateMenuButton>
    );
  }

  return (
    <Tooltip
      trigger={({
        children: tooltipChildren,
        ...tooltipTriggerProps
      }: React.HTMLProps<HTMLInputElement>) => (
        <div {...tooltipTriggerProps}>
          <UpdateMenuButton onClick={onClick} isWritable={false} />
          {tooltipChildren}
        </div>
      )}
      // Disable the tooltip when the instance is in a writable state.
      enabled={!isWritable}
      justify="middle"
    >
      {disabledTooltip}
    </Tooltip>
  );
};

export default UpdateMenu;
