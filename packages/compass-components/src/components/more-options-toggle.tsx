import React, { useMemo } from 'react';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

import { useFocusRing } from '../hooks/use-focus-ring';
import { Link, Icon } from './leafygreen';
import { mergeProps } from '../utils/merge-props';

const optionContainerStyles = css({
  textAlign: 'center',
  minWidth: spacing[4] * 5,
});

const optionsButtonStyles = css({
  // Reset button styles.
  backgroundColor: 'transparent',
  border: 'none',

  padding: `${spacing[1]}px ${spacing[2]}px`,
});

const optionStyles = css({
  display: 'flex',
  alignItems: 'center',
});

type MoreOptionsToggleProps = {
  'aria-controls': string;
  'data-testid'?: string;
  isExpanded: boolean;
  onToggleOptions: () => void;
  id?: string;
};

export const MoreOptionsToggle: React.FunctionComponent<MoreOptionsToggleProps> =
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
    const focusRingProps = useFocusRing();
    const buttonProps = mergeProps(
      {
        className: optionsButtonStyles,
      },
      focusRingProps
      // We cast here so that the `as` prop of link can be properly typed.
    ) as Partial<React.ComponentType<React.ComponentProps<typeof Link>>>;

    return (
      <div className={optionContainerStyles}>
        <Link
          aria-label={optionsLabel}
          aria-expanded={isExpanded}
          aria-controls={ariaControls}
          as="button"
          hideExternalIcon={true}
          data-testid={dataTestId}
          id={id}
          type="button"
          onClick={onToggleOptions}
          {...buttonProps}
        >
          <div className={optionStyles}>
            {optionsLabel}
            <Icon glyph={optionsIcon} />
          </div>
        </Link>
      </div>
    );
  };
