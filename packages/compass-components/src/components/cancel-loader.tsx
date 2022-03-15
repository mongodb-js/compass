import { css } from '@leafygreen-ui/emotion';
import React from 'react';

const cancelLoaderStyle = css({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 0',
});

const progressTextStyle = css({
  margin: '0 auto 30px',
  textAlign: 'left',
  fontSize: '24px',
  color: '#807f7f',
  fontWeight: 200,
});

const spinnerStyle = css({
  animation: 'fa-spin 2s infinite linear',
  width: '40px',
  textAlign: 'center',
  display: 'inline-block',
  textRendering: 'auto',
  font: 'normal normal normal 20px/1 FontAwesome',
  '&::before': {
    boxSizing: 'border-box',
    content: '"\\f1ce"',
  },
});

const buttonStyle = css({
  padding: '0 10px 0 10px',
  height: '28px',
  fontWeight: 'bold',
  fontSize: '13px',
  lineHeight: '26px',
  textTransform: 'uppercase',
  backgroundColor: 'transparent',
  border: '1px solid #13AA52',
  borderRadius: '3px',
  boxShadow: 'none',
  color: '#13AA52',
  fontFamily: 'Akzidenz',
  WebkitAppearance: 'button',
  cursor: 'pointer',
  overflow: 'visible',
  margin: 0,
  boxSizing: 'border-box',
  outline: 'none',
});

function CancelLoader({
  dataTestId,
  progressText,
  cancelText,
  onCancel,
}: {
  dataTestId: string;
  progressText: string;
  cancelText: string;
  onCancel: () => void;
}): React.ReactElement {
  return (
    <div data-testid={dataTestId} className={cancelLoaderStyle}>
      <div className={progressTextStyle}>
        <i className={spinnerStyle} />
        {progressText}
      </div>
      <div>
        <button className={buttonStyle} onClick={onCancel}>
          {cancelText}
        </button>
      </div>
    </div>
  );
}

export default CancelLoader;
