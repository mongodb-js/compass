import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import { css } from '@mongodb-js/compass-components';
import { exportToLanguage } from '../../../modules/export-to-language';

const containerStyles = css({
  display: 'flex',
});

const PipelineOptions: React.FunctionComponent<PipelineOptionsProps> = () => {
  return (
    <div className={containerStyles}>
      <span>Hello</span>
    </div>
  );
};

const connector = connect(null, {
  onExportToLanguage: exportToLanguage,
});
type PipelineOptionsProps = ConnectedProps<typeof connector>;
export default connector(PipelineOptions);
