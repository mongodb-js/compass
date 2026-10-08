import React from 'react';
import { renderTemplate } from './render-template';
import { Link, useTranslation } from '@mongodb-js/compass-components';

const PipelineConfirmationDescription = ({
  typeOfWrite,
  stage,
  ns,
}: {
  typeOfWrite: string;
  stage: { name: string; link: string };
  ns: string | null;
}) => {
  const t = useTranslation();
  const stageLink = (
    <Link hideExternalIcon={false} href={stage.link} target="_blank">
      {stage.name}
    </Link>
  );
  return (
    <div data-testid="confirmation-description">
      {ns
        ? renderTemplate(
            t(
              `aggregations.writeConfirmation.${typeOfWrite}`,
              `This pipeline will execute a {stage} operation, ${typeOfWrite} "{ns}". Do you wish to proceed?`
            ),
            { stage: stageLink, ns: <b>{ns}</b> }
          )
        : renderTemplate(
            t(
              'aggregations.writeConfirmation.unknownNamespace',
              'This pipeline will execute a {stage} operation, that may alter or overwrite a collection. Do you wish to proceed?'
            ),
            { stage: stageLink }
          )}
    </div>
  );
};

export const runPipelineConfirmationDescription = (props: {
  typeOfWrite: string;
  stage: { name: string; link: string };
  ns: string | null;
}) => {
  return <PipelineConfirmationDescription {...props} />;
};
