import { cx } from '@mongodb-js/compass-components';
import { css } from '@mongodb-js/compass-components';
import { Button, Icon } from '@mongodb-js/compass-components';
import React, { useCallback, useEffect, useState } from 'react';

const actionButtonStyle = css({
  flex: 'none',
});

const actionButtonContentStyle = css({
  position: 'relative',
});

const actionButtonIconContainerStyle = css({
  opacity: 1,
  // leafygreen icon small size
  width: 14,
  height: 14,
  transition: 'opacity .2s linear',
});

const actionButtonIconContainerHiddenStyle = css({
  opacity: 0,
});

const actionButtonClickResultIconStyle = css({
  position: 'absolute',
  // leafygreen icon small size
  width: 14,
  height: 14,
  top: 0,
  pointerEvents: 'none',
  opacity: 1,
  transition: 'opacity .2s linear',
});

const actionButtonClickResultIconHiddenStyle = css({
  opacity: 0,
});

export const ActionButton: React.FunctionComponent<{
  icon: string | React.ReactNode;
  label: string;
  onClick?: (
    ...args: Parameters<React.MouseEventHandler<HTMLButtonElement>>
  ) => boolean | void;
  'data-testid'?: string;
}> = ({ label, icon, onClick, ...props }) => {
  const [clickResult, setClickResult] = useState<'success' | 'error'>(
    'success'
  );
  const [clickResultVisible, setClickResultVisible] = useState(false);

  const onButtonClick = useCallback(
    (...args: Parameters<React.MouseEventHandler<HTMLButtonElement>>) => {
      const result = onClick?.(...args);
      if (typeof result === 'boolean') {
        setClickResult(result ? 'success' : 'error');
        setClickResultVisible(true);
      }
    },
    [onClick]
  );

  useEffect(() => {
    if (!clickResultVisible) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setClickResultVisible(false);
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [clickResultVisible]);

  return (
    <Button
      size="xsmall"
      aria-label={label}
      title={label}
      onClick={onButtonClick}
      className={actionButtonStyle}
      data-testid={props['data-testid'] ?? `editor-action-${label}`}
    >
      <div className={actionButtonContentStyle}>
        <div
          className={cx(
            actionButtonIconContainerStyle,
            clickResultVisible && actionButtonIconContainerHiddenStyle
          )}
        >
          {typeof icon === 'string' ? (
            <Icon
              size="small"
              role="presentation"
              title={null}
              glyph={icon}
            ></Icon>
          ) : (
            icon
          )}
        </div>
        <div
          className={cx(
            actionButtonClickResultIconStyle,
            !clickResultVisible && actionButtonClickResultIconHiddenStyle
          )}
        >
          <Icon
            size="small"
            glyph={clickResult === 'success' ? 'Checkmark' : 'X'}
          ></Icon>
        </div>
      </div>
    </Button>
  );
};

export const FormatIcon = ({
  size = 16,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    width={size}
    height={size}
    viewBox="0 0 16 16"
    {...props}
  >
    <path
      fill="currentColor"
      d="M2 4a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm0 4a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm1 3a1 1 0 1 0 0 2h10a1 1 0 1 0 0-2H3Zm4-7a1 1 0 0 1 1-1h5a1 1 0 1 1 0 2H8a1 1 0 0 1-1-1Zm4 4a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1Z"
    />
  </svg>
);
