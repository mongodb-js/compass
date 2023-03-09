import { Button, css, cx, Icon } from '@mongodb-js/compass-components';
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

const ActionButton: React.FunctionComponent<{
  icon: string | React.ReactNode;
  label: string;
  onClick: (
    ...args: Parameters<React.MouseEventHandler<HTMLButtonElement>>
  ) => boolean | void;
}> = ({ label, icon, onClick }) => {
  const [clickResult, setClickResult] = useState<'success' | 'error'>(
    'success'
  );
  const [clickResultVisible, setClickResultVisible] = useState(false);

  const onButtonClick = useCallback(
    (...args: Parameters<React.MouseEventHandler<HTMLButtonElement>>) => {
      const result = onClick(...args);
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

export { ActionButton };
