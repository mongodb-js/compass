import React, { useMemo, useState } from 'react';
import type { Document } from 'mongodb';
import { Button, ErrorSummary } from '@mongodb-js/compass-components';
import { STAGE_CREATOR_USE_CASES } from './use-cases';
import type { Field } from './use-cases';
import { StageCreatorForm } from './stage-creator-form';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';

const StageCreator = ({ fields }: { fields: Field[] }) => {
  const [stageId, setStageId] = React.useState<string | null>(null);
  const [stageData, setStageData] = useState<unknown>(undefined);
  const [document, setDocument] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stage = useMemo(() => {
    return STAGE_CREATOR_USE_CASES.find((stage) => stage.id === stageId);
  }, [stageId]);
  const StageTemplate = stage?.component;
  const onSelectStage = (id: string) => {
    setStageId(id);
    setStageData(undefined);
    setDocument(null);
  };
  const onApply = () => {
    if (!stage) {
      return;
    }
    try {
      setError(null);
      if ('validateData' in stage.component) {
        (stage.component as any).validateData(stageData);
      }
      setDocument(stage.mapFormStateToStage(stageData));
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const onCancel = () => {
    setStageId(null);
    setStageData(undefined);
    setDocument(null);
    setError(null);
  };
  return (
    <div
      style={{
        width: '50%',
        paddingRight: '8px',
        display: 'flex',
        gap: '8px',
        flexDirection: 'column',
      }}
    >
      <h3>Stage Creator</h3>
      <hr />
      {STAGE_CREATOR_USE_CASES.map((stage) => (
        <Button
          key={stage.id}
          size="small"
          onClick={() => onSelectStage(stage.id)}
        >
          {stage.description}
        </Button>
      ))}
      {stage && StageTemplate && (
        <>
          <hr />
          <h3>Selected Stage ID: {stage.title}</h3>
          <StageCreatorForm
            name={`stage-creator-${stage.id}`}
            onCancel={onCancel}
            onApply={onApply}
          >
            <StageTemplate
              fields={fields}
              initialData={stageData}
              onChange={(data: unknown) => setStageData(data)}
            />
          </StageCreatorForm>
          {error && <ErrorSummary errors={[error]} />}
          {document && (
            <div>
              <h3>Stage Document</h3>
              <pre>{JSON.stringify(document, null, 2)}</pre>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default connect((state: RootState) => {
  return {
    fields: state.fields,
    serverVersion: state.serverVersion,
  };
})(StageCreator);
