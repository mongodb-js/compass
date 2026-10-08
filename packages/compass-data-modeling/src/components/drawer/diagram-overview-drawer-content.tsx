import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import {
  css,
  cx,
  Icon,
  Label,
  palette,
  spacing,
  TextInput,
  useDarkMode,
  useTranslation,
} from '@mongodb-js/compass-components';
import { renameDiagram } from '../../store/diagram';
import type { DataModelingState } from '../../store/reducer';
import {
  DMDrawerSection,
  DMFormFieldContainer,
} from './drawer-section-components';
import { useChangeOnBlur } from './use-change-on-blur';
import { getIsNewNameValid } from './util';
import { useConnectionInfoForId } from '@mongodb-js/compass-connections/provider';
import { useDataModelSavedItems } from '../../provider';

const infoContainerStyles = css({
  marginTop: spacing[400],
});

const infoTextStyles = css({
  color: palette.gray.dark1,
  display: 'flex',
  gap: spacing[200],
  marginTop: spacing[800],
  svg: {
    marginTop: spacing[100],
  },
});

const infoTextStylesDark = css({
  color: palette.gray.light1,
});

const infoItemLabelStyles = css({
  fontWeight: 'bold',
  color: palette.gray.base,
});

const LabeledInfoItem = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <span className={infoItemLabelStyles}>{label}</span>&nbsp;
    {children}
  </div>
);

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short',
});
const formatDateTime = (dateTime: string) =>
  dateFormatter.format(new Date(dateTime).getTime());

type DiagramOverviewDrawerContentProps = {
  diagramId: string;
  diagramName: string;
  createdAt: string;
  updatedAt: string;
  connectionId?: string;
  database: string;
  onRenameDiagram: (id: string, newName: string) => void;
};

const DiagramOverviewDrawerContent: React.FunctionComponent<
  DiagramOverviewDrawerContentProps
> = ({
  diagramId,
  diagramName: _diagramName,
  createdAt,
  updatedAt,
  connectionId,
  database,
  onRenameDiagram,
}) => {
  const darkMode = useDarkMode();
  const t = useTranslation();
  const connectionInfo = useConnectionInfoForId(connectionId);
  const { items: savedDiagrams } = useDataModelSavedItems();
  const diagramNames = useMemo(
    () => savedDiagrams.map((diagram) => diagram.name),
    [savedDiagrams]
  );

  const { value: diagramName, ...nameInputProps } = useChangeOnBlur(
    _diagramName,
    (newName) => {
      const trimmedName = newName.trim();
      if (!isDiagramNameValid) {
        return;
      }
      if (trimmedName === _diagramName) {
        return;
      }
      onRenameDiagram(diagramId, trimmedName);
    }
  );

  const {
    isValid: isDiagramNameValid,
    errorMessage: diagramNameEditErrorMessage,
  } = useMemo(
    () =>
      getIsNewNameValid({
        newName: diagramName,
        existingNames: diagramNames,
        currentName: _diagramName,
        entity: 'Diagram',
        t,
      }),
    [diagramName, _diagramName, diagramNames, t]
  );

  return (
    <>
      <DMDrawerSection label={t('dataModeling.overview.model', 'Model')}>
        <DMFormFieldContainer>
          <TextInput
            label={t('dataModeling.setup.diagramName', 'Diagram name')}
            data-testid="data-model-overview-drawer-name-input"
            sizeVariant="small"
            value={diagramName}
            {...nameInputProps}
            state={isDiagramNameValid ? undefined : 'error'}
            errorMessage={diagramNameEditErrorMessage}
          />
        </DMFormFieldContainer>
        <div className={infoContainerStyles}>
          <Label as="div" htmlFor="">
            {t('dataModeling.overview.generated', 'Generated')}
          </Label>
          <LabeledInfoItem label={t('dataModeling.overview.from', 'From')}>
            {connectionInfo ? `${connectionInfo.title}.${database}` : database}
          </LabeledInfoItem>
          <LabeledInfoItem label={t('dataModeling.overview.at', 'At')}>
            {formatDateTime(createdAt)}
          </LabeledInfoItem>
        </div>
        <div className={infoContainerStyles}>
          <Label as="div" htmlFor="">
            {t('dataModeling.overview.lastUpdated', 'Last updated')}
          </Label>
          <LabeledInfoItem label={t('dataModeling.overview.at', 'At')}>
            {formatDateTime(updatedAt)}
          </LabeledInfoItem>
        </div>
        <div className={cx(infoTextStyles, darkMode && infoTextStylesDark)}>
          <Icon glyph="InfoWithCircle" />
          <span>
            {t(
              'dataModeling.overview.sampleInfo',
              'This diagram was generated based on a sample of documents. Changes made to the diagram will not impact your data.'
            )}
          </span>
        </div>
      </DMDrawerSection>
    </>
  );
};

export default connect(
  (state: DataModelingState) => {
    if (!state.diagram) {
      throw new Error('No diagram selected');
    }
    return {
      diagramId: state.diagram.id,
      diagramName: state.diagram.name,
      createdAt: state.diagram.createdAt,
      updatedAt: state.diagram.updatedAt,
      connectionId: state.diagram.connectionId ?? undefined,
      database: state.diagram.database,
    };
  },
  {
    onRenameDiagram: renameDiagram,
  }
)(DiagramOverviewDrawerContent);
