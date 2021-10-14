/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import React from 'react';

const cancelLoaderStyle = css({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 0'
});

const progressTextStyle = css({
  margin: '0 auto 30px',
  textAlign: 'left',
  fontSize: '24px',
  color: '#807f7f',
  fontWeight: 200,
});

const iconStyle = css({
  fontSize: '20px',
  width: '40px',
});

const buttonsStyle = css({
  fontSize: '14px',
})

function CancelLoader({
  dataTestId,
  progressText,
  cancelText,
  onCancel,
}: {
  dataTestId: string;
  progressText: string;
  cancelText: string;
  cancelClicked: () => void;
}): React.ReactElement {
  return (
    <div data-testid={dataTestId} css={cancelLoaderStyle}>
      <div css={progressTextStyle}>
        <i className="fa fa-fw fa-spin fa-circle-o-notch" css={iconStyle} />
        {progressText}
      </div>
      <div css={buttonsStyle}>
        <button className="btn btn-sm btn-info" onClick={onCancel}>
          {cancelText}
        </button>
      </div>
    </div>
  );
}

export default CancelLoader;
