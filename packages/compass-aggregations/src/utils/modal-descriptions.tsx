import React from 'react';
import { Link } from '@mongodb-js/compass-components';

export const runPipelineConfirmationDescription = ({
  typeOfWrite,
  stage,
  ns,
}: {
  typeOfWrite: string;
  stage: { name: string; link: string };
  ns: string;
}) => (
  <>
    This pipeline will execute a{' '}
    <Link hideExternalIcon={false} href={stage.link} target="_blank">
      {stage.name}
    </Link>{' '}
    operation, {typeOfWrite} &quot;<b>{ns}</b>&quot;. Do you wish to proceed?
  </>
);