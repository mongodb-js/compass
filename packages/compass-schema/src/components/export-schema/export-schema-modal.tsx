import {
  Banner,
  BannerVariant,
  Checkbox,
  css,
  InfoModal,
  Option,
  Select,
  spacing,
  TextInput,
  WorkspaceContainer,
} from '@mongodb-js/compass-components';
import type { Schema } from 'mongodb-schema';
import React, { useMemo, useState, useCallback } from 'react';

import { JSONEditor } from '@mongodb-js/compass-editor';
import { ActionButton } from './export-schema-modal-action-button';
import { exportMongodbJSONSchema } from './formats/mongodb-json-schema';
import { exportCompassInternalSchema } from './formats/compass-internal-schema';
import { exportJSONSchema } from './formats/ejson-json-schema';

type ExportSchemaModalProps = {
  schema: Schema;
  closeExportSchema: () => void;
  exportSchemaOpened: boolean;
};

type Export = { code?: string; error?: string };

type ExportPanelProps = { settings?: JSX.Element; exportInfo: Export };

const exportPanelStyles = css({
  display: 'grid',
  gridTemplateColumns: `1fr 1fr`,
  gridTemplateRows: '1fr',
  gap: spacing[2],
  maxHeight: '100%',
  position: 'relative',
});

const exportPanelCodeAreaStyles = css({
  position: 'relative',
});

const editorStyles = css({
  width: spacing[6] * 10,
  height: spacing[6] * 7,
});

const exportPanelCopyButtonStyles = css({
  position: 'absolute',
  top: spacing[2],
  right: spacing[3],
});

const exportPanelSettingsAreaStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
});

const ExportPanel: React.FunctionComponent<ExportPanelProps> = ({
  settings,
  exportInfo,
}) => {
  const handleCopy = useCallback(() => {
    if (exportInfo.code) {
      void navigator.clipboard.writeText(exportInfo.code);
      return true;
    }

    return false;
  }, [exportInfo.code]);

  return (
    <div className={exportPanelStyles}>
      <div className={exportPanelCodeAreaStyles}>
        {exportInfo.error ? (
          <Banner variant={BannerVariant.Danger}>
            Error: {exportInfo.error}
          </Banner>
        ) : (
          <>
            <WorkspaceContainer className={editorStyles}>
              <JSONEditor
                text={exportInfo.code || ''}
                readOnly={true}
                showFoldGutter={false}
                showLineNumbers={false}
              />
            </WorkspaceContainer>
            <div className={exportPanelCopyButtonStyles}>
              <ActionButton
                key="Copy"
                label="Copy"
                icon="Copy"
                onClick={handleCopy}
              />
            </div>
          </>
        )}
      </div>

      {settings && (
        <div className={exportPanelSettingsAreaStyles}>{settings}</div>
      )}
    </div>
  );
};

function useSchemaConversion<T>(
  schema: Schema,
  settings: T,
  converter: (schema: Schema, settings: T) => string
): Export {
  const exportInfo = useMemo(() => {
    try {
      return {
        code: converter(schema, settings),
      };
    } catch (e) {
      const errorMessage = (e as Error)?.message || '';
      return { error: `Conversion failed: ${errorMessage}` };
    }
  }, [converter, schema, ...(settings && Object.values(settings))]);

  return exportInfo;
}

const MongodbJsonSchema: React.FunctionComponent<{ schema: Schema }> = ({
  schema,
}) => {
  const [includeId, setIncludeId] = useState<boolean>(true);
  const [additionalProperties, setAdditionalProperties] =
    useState<boolean>(true);
  const [requireMandatoryProperties, setRequireMandatoryProperties] =
    useState<boolean>(true);

  const exportInfo: Export = useSchemaConversion(
    schema,
    { includeId, requireMandatoryProperties, additionalProperties },
    (schema, settings) =>
      JSON.stringify(exportMongodbJSONSchema(schema, settings), null, 2)
  );

  return (
    <ExportPanel
      exportInfo={exportInfo}
      settings={
        <>
          <Checkbox
            label="Include _id"
            onChange={(event) => setIncludeId(event.target.checked)}
            checked={includeId}
          />
          <Checkbox
            label="Allow additional properties"
            onChange={(event) => setAdditionalProperties(event.target.checked)}
            checked={additionalProperties}
          />
          <Checkbox
            label="Require mandatory properties"
            onChange={(event) =>
              setRequireMandatoryProperties(event.target.checked)
            }
            checked={requireMandatoryProperties}
          />
        </>
      }
    />
  );
};

const JsonSchema: React.FunctionComponent<{ schema: Schema }> = ({
  schema,
}) => {
  const [includeId, setIncludeId] = useState<boolean>(false);
  const [additionalProperties, setAdditionalProperties] =
    useState<boolean>(true);
  const [requireMandatoryProperties, setRequireMandatoryProperties] =
    useState<boolean>(true);

  const [relaxed, setRelaxed] = useState<boolean>(true);

  const exportInfo: Export = useSchemaConversion(
    schema,
    { includeId, requireMandatoryProperties, additionalProperties, relaxed },
    (schema, settings) =>
      JSON.stringify(exportJSONSchema(schema, settings), null, 2)
  );

  return (
    <ExportPanel
      exportInfo={exportInfo}
      settings={
        <>
          <Checkbox
            label="Include _id"
            onChange={(event) => setIncludeId(event.target.checked)}
            checked={includeId}
          />
          <Checkbox
            label="Allow additional properties"
            onChange={(event) => setAdditionalProperties(event.target.checked)}
            checked={additionalProperties}
          />
          <Checkbox
            label="Require mandatory properties"
            onChange={(event) =>
              setRequireMandatoryProperties(event.target.checked)
            }
            checked={requireMandatoryProperties}
          />
          <Select
            label="EJSON Format"
            data-testid="export-schema-type-select"
            allowDeselect={false}
            value={relaxed ? 'relaxed' : 'canonical'}
            aria-label="Select an EJSON format"
            onChange={(newVal: string) => {
              setRelaxed(newVal === 'relaxed');
            }}
          >
            <Option value="relaxed">Relaxed</Option>
            <Option value="canonical">Canonical</Option>
          </Select>
        </>
      }
    />
  );
};

const CompassInternalSchema: React.FunctionComponent<{ schema: Schema }> = ({
  schema,
}) => {
  const [maxValues, setMaxValues] = useState<number>(3);

  const exportInfo: Export = useSchemaConversion(
    schema,
    { maxValues },
    (schema, settings) =>
      JSON.stringify(exportCompassInternalSchema(schema, settings), null, 2)
  );

  return (
    <ExportPanel
      exportInfo={exportInfo}
      settings={
        <>
          <TextInput
            label="Max sample values"
            type="number"
            min={0}
            max={1000}
            onChange={(event) => setMaxValues(+event.target.value)}
            value={String(maxValues)}
          />
        </>
      }
    />
  );
};

const exportSchemaModalGridStyles = css({
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
  gap: spacing[2],
  height: '100%',
});

type ExportFormat = 'mongodbJsonSchema' | 'internalSchema' | 'jsonSchema';

const ExportSchemaModal: React.FunctionComponent<ExportSchemaModalProps> = ({
  schema,
  closeExportSchema,
  exportSchemaOpened,
}) => {
  const [schemaType, setSchemaType] =
    useState<ExportFormat>('mongodbJsonSchema');

  return (
    <InfoModal
      data-testid="export-schema-modal"
      onClose={closeExportSchema}
      title="Export Schema"
      size="large"
      open={exportSchemaOpened}
    >
      <div className={exportSchemaModalGridStyles}>
        <Select
          label="Format"
          data-testid="export-schema-type-select"
          allowDeselect={false}
          value={schemaType}
          aria-label="Select an export format"
          onChange={(newVal: string) => {
            setSchemaType(newVal as ExportFormat);
          }}
        >
          <Option value="mongodbJsonSchema">
            MongoDB Validation Schema ($jsonSchema)
          </Option>
          <Option value="jsonSchema">JSON Schema (EJSON)</Option>
          <Option value="internalSchema">Compass Internal Schema</Option>
        </Select>

        <div>
          {schemaType === 'internalSchema' && (
            <CompassInternalSchema schema={schema} />
          )}
          {schemaType === 'mongodbJsonSchema' && (
            <MongodbJsonSchema schema={schema} />
          )}
          {schemaType === 'jsonSchema' && <JsonSchema schema={schema} />}
        </div>
      </div>
    </InfoModal>
  );
};

export { ExportSchemaModal };
