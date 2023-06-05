import React, { useCallback, useMemo } from 'react';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

import { useFocusRing } from '../hooks/use-focus-ring';
import { Link, Icon } from './leafygreen';
import { mergeProps } from '../utils/merge-props';

const optionContainerStyles = css({
  textAlign: 'center',
});

const optionsButtonStyles = css({
  // Reset button styles.
  backgroundColor: 'transparent',
  border: 'none',
  paddingTop: spacing[1],
  paddingBottom: spacing[1],
  paddingLeft: spacing[2],
  paddingRight: spacing[2],
});

const optionStyles = css({
  display: 'flex',
  alignItems: 'center',
});

type MoreOptionsToggleProps = {
  label?: (expanded: boolean) => string;
  'aria-label'?: (expanded: boolean) => string;
  'aria-controls': string;
  'data-testid'?: string;
  isExpanded: boolean;
  onToggleOptions: () => void;
  id?: string;
};

export const MoreOptionsToggle: React.FunctionComponent<
  MoreOptionsToggleProps
> = ({
  'aria-controls': ariaControls,
  isExpanded,
  id,
  'data-testid': dataTestId,
  onToggleOptions,
  label = (expanded) => {
    return expanded ? 'Fewer Options' : 'More Options';
  },
  'aria-label': ariaLabel,
}) => {
  const optionsIcon = useMemo(
    () => (isExpanded ? 'CaretDown' : 'CaretRight'),
    [isExpanded]
  );
  const optionsLabel = label(isExpanded);
  const labelStyle = useMemo(() => {
    const maxLabelLength = Math.max(label(true).length, label(false).length);
    return {
      // Maximum char length of the more / less label + icon size + button padding
      width: `calc(${maxLabelLength}ch + ${spacing[3]}px + ${spacing[2]}px)`,
    };
  }, [label]);
  const optionsAriaLabel = ariaLabel?.(isExpanded) ?? optionsLabel;
  const focusRingProps = useFocusRing();
  const buttonProps = mergeProps(
    { className: optionsButtonStyles },
    focusRingProps
    // We cast here so that the `as` prop of link can be properly typed.
  ) as Partial<React.ComponentType<React.ComponentProps<typeof Link>>>;
  const onClick = useCallback(() => {
    onToggleOptions();
  }, [onToggleOptions]);

  return (
    <div className={optionContainerStyles} style={labelStyle}>
      <Link
        aria-label={optionsAriaLabel}
        aria-expanded={isExpanded}
        aria-controls={ariaControls}
        as="button"
        type="button"
        hideExternalIcon={true}
        data-testid={dataTestId}
        id={id}
        onClick={onClick}
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
