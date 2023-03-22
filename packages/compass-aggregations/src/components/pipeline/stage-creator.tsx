import React, { useMemo, useState } from 'react';
import type { Document } from 'mongodb';
import { Button, Card } from '@mongodb-js/compass-components';

import { SortForm, SortFormState } from './sort-form';
import { ProjectForm, ProjectFormState } from './project-form';
import { MatchForm, MatchFormState, convertToStage } from './match-form';
import { StageCreatorForm } from './stage-creator-form';

export type Field = { name: string; value: string };

type StageCreatorUseCase = {
  id: string;
  title: string;
  description: string;
  stageOperator: string;
  component: React.FunctionComponent<{
    fields: Field[];
    onChange: (data: any) => void;
    initialData?: any;
  }>;
  mapFormStateToStage: (data: any) => Document;
};

const STAGE_CREATOR_USE_CASES: StageCreatorUseCase[] = [
  {
    id: 'match',
    title: 'Match',
    description: 'Filter documents by condition',
    stageOperator: '$match',
    component: MatchForm,
    mapFormStateToStage: (data: MatchFormState) => {
      return { $match: convertToStage(data) };
    },
  },
  {
    id: 'project',
    title: 'Project',
    description: 'Include or exclude fields',
    stageOperator: '$project',
    component: ProjectForm,
    mapFormStateToStage: (data: ProjectFormState) => {
      const project: Document = {};
      data.fields.forEach((field) => {
        project[field] = data.type === 'Include' ? 1 : 0;
      });
      return { $project: project };
    },
  },
  {
    id: 'sort',
    title: 'Sort',
    description: 'Sort documents by field',
    stageOperator: '$sort',
    component: SortForm,
    mapFormStateToStage: (data: SortFormState[]) => {
      const sort: Document = {};
      data.forEach(({ field, direction }) => {
        sort[field] = direction === 'Asc' ? 1 : -1;
      });
      return { $sort: sort };
    },
  },
];

export const StageCreator = ({ fields }: { fields: Field[] }) => {
  const [stageId, setStageId] = React.useState<string | null>('match');
  const [stageData, setStageData] = useState<unknown>(undefined);
  const [document, setDocument] = useState<Document | null>(null);

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
    setDocument(stage.mapFormStateToStage(stageData));
  };
  const onCancel = () => {
    setStageId(null);
    setStageData(undefined);
    setDocument(null);
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
        <Card onClick={() => onSelectStage(stage.id)}>{stage.description}</Card>
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
