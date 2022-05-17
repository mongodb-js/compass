import React, { useMemo } from 'react';
import { Link, Icon } from './leafygreen';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { uiColors } from '@leafygreen-ui/palette';

const optionsButtonStyles = css({
  backgroundColor: 'transparent',
  border: 'none',
  display: 'inline',
  height: spacing[4] + spacing[1],
  ':focus': {
    outline: `${spacing[1]}px auto ${uiColors.focus}`,
  },
});

const optionStyles = css({
  display: 'flex',
  alignItems: 'center',
});

type OptionsDropdownButtonProps = {
  'aria-controls': string;
  'data-testid'?: string;
  isExpanded: boolean;
  onToggleOptions: () => void;
  id?: string;
};

export const OptionsDropdownButton: React.FunctionComponent<OptionsDropdownButtonProps> =
  ({
    'aria-controls': ariaControls,
    isExpanded,
    id,
    'data-testid': dataTestId,
    onToggleOptions,
  }) => {
    const optionsIcon = useMemo(
      () => (isExpanded ? 'CaretDown' : 'CaretRight'),
      [isExpanded]
    );
    const optionsLabel = useMemo(
      () => (isExpanded ? 'Less Options' : 'More Options'),
      [isExpanded]
    );
    return (
      <Link
        aria-label={optionsLabel}
        aria-expanded={isExpanded}
        aria-controls={ariaControls}
        id={id}
        as="button"
        className={optionsButtonStyles}
        data-testid={dataTestId}
        hideExternalIcon={true}
        onClick={onToggleOptions}
      >
        <div className={optionStyles}>
          {optionsLabel}
          <Icon glyph={optionsIcon} />
        </div>
      </Link>
    );
  };
