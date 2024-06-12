import React from 'react';
import { Link } from '@mongodb-js/compass-components';

export const runPipelineConfirmationDescription = ({
  typeOfWrite,
  stage,
  ns,
}: {
  typeOfWrite: string;
  stage: { name: string; link: string };
  ns: string | null;
}) => {
  return (
    <div data-testid="confirmation-description">
      This pipeline will execute a{' '}
      <Link hideExternalIcon={false} href={stage.link} target="_blank">
        {stage.name}
      </Link>{' '}
      operation,{' '}
      {ns ? (
        <>
          {typeOfWrite} &quot;<b>{ns}</b>&quot;
        </>
      ) : (
        <>that may alter or overwrite a collection</>
      )}
      . Do you wish to proceed?
    </div>
  );
};
