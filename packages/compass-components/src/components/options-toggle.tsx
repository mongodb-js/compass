import React, { useCallback, useMemo } from 'react';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import type { InferredPolymorphicComponentType } from '@leafygreen-ui/polymorphic';

import { useFocusRing } from '../hooks/use-focus-ring';
import { Link, Icon } from './leafygreen';
import { mergeProps } from '../utils/merge-props';

const optionContainerStyles = css({
  textAlign: 'center',
  whiteSpace: 'nowrap',
});

const optionsButtonStyles = css({
  // Reset button styles.
  backgroundColor: 'transparent',
  border: 'none',
  paddingTop: spacing[100],
  paddingBottom: spacing[100],
  paddingLeft: spacing[200],
  paddingRight: spacing[200],
});

const optionStyles = css({
  display: 'flex',
  alignItems: 'center',
});

type OptionsToggleProps = {
  label?: (expanded: boolean) => string;
  'aria-label'?: (expanded: boolean) => string;
  'aria-controls': string;
  'data-testid'?: string;
  isExpanded: boolean;
  onToggleOptions: () => void;
  id?: string;
};

// Full-width CJK characters are ~2× the display width of ASCII chars in `ch` units
function getLabelDisplayWidth(str: string): number {
  let width = 0;
  for (const char of str) {
    const code = char.codePointAt(0) ?? 0;
    const isFullWidth =
      (code >= 0x1100 && code <= 0x115f) || // Hangul Jamo
      (code >= 0x2e80 && code <= 0xa4cf) || // CJK Radicals through Yi
      (code >= 0xac00 && code <= 0xd7af) || // Hangul Syllables
      (code >= 0xf900 && code <= 0xfaff) || // CJK Compatibility Ideographs
      (code >= 0xfe10 && code <= 0xfe1f) || // Vertical Forms
      (code >= 0xfe30 && code <= 0xfe6f) || // CJK Compatibility Forms
      (code >= 0xff01 && code <= 0xff60) || // Fullwidth Forms
      (code >= 0xffe0 && code <= 0xffe6); // Fullwidth Signs
    width += isFullWidth ? 2 : 1;
  }
  return width;
}

export const OptionsToggle: React.FunctionComponent<OptionsToggleProps> = ({
  'aria-controls': ariaControls,
  isExpanded,
  id,
  'data-testid': dataTestId,
  onToggleOptions,
  label = () => 'Options',
  'aria-label': ariaLabel = (expanded) => {
    return expanded ? 'Fewer Options' : 'More Options';
  },
}) => {
  const optionsIcon = useMemo(
    () => (isExpanded ? 'CaretDown' : 'CaretRight'),
    [isExpanded]
  );
  const optionsLabel = label(isExpanded);
  const labelStyle = useMemo(() => {
    const maxLabelLength = Math.max(
      getLabelDisplayWidth(label(true)),
      getLabelDisplayWidth(label(false))
    );
    return {
      // Maximum char length of the more / less label + icon size + button padding
      width: `calc(${maxLabelLength}ch + ${spacing[400]}px + ${spacing[200]}px)`,
    };
  }, [label]);
  const optionsAriaLabel = ariaLabel(isExpanded);
  const focusRingProps = useFocusRing();
  const buttonProps = mergeProps(
    { className: optionsButtonStyles },
    focusRingProps
    // We cast here so that the `as` prop of link can be properly typed.
  ) as Partial<InferredPolymorphicComponentType<typeof Link, 'button'>>;
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
