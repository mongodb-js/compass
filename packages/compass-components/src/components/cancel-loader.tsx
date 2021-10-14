/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import React from 'react';

const cancelLoaderStyle = css({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 0',
  '.progress-text': {
    margin: '0 auto 30px',
    textAlign: 'left',
    fontSize: '24px',
    color: '#807f7f',
    fontWeight: 200,
    '.fa.fa-fw': {
      fontSize: '20px',
      width: '40px',
    },
  },
  '.buttons': {
    fontSize: '14px',
  },
});

function CancelLoader({
  dataTestId,
  progressText,
  cancelText,
  cancelClicked,
}: {
  dataTestId: string;
  progressText: string;
  cancelText: string;
  cancelClicked: () => void;
}): React.ReactElement {
  return (
    <div className="loader" data-testid={dataTestId} css={cancelLoaderStyle}>
      <div className="progress-text">
        <i className="fa fa-fw fa-spin fa-circle-o-notch" />
        {progressText}
      </div>
      <div className="buttons">
        <button className="btn btn-sm btn-info" onClick={cancelClicked}>
          {cancelText}
        </button>
      </div>
    </div>
  );
}

export default CancelLoader;
