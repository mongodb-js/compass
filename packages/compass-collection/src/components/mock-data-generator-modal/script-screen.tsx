import React, { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import {
  Banner,
  Body,
  Code,
  Copyable,
  css,
  cx,
  InlineCode,
  Language,
  Link,
  Overline,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import toNS from 'mongodb-ns';
import { generateScript } from './script-generation-utils';
import type { DataGenerationStep } from './types';
import { DataGenerationSteps, type FakerSchema } from './types';
import type { ArrayLengthMap } from './script-generation-utils';
import type { CollectionState } from '../../modules/collection-tab';
import { SCHEMA_ANALYSIS_STATE_COMPLETE } from '../../schema-analysis-types';
import {
  type TrackFunction,
  useTelemetry,
  useTrackOnChange,
} from '@mongodb-js/compass-telemetry/provider';
import {
  DEFAULT_CONNECTION_STRING_FALLBACK,
  DEFAULT_DOCUMENT_COUNT,
} from './constants';
import { redactConnectionString } from 'mongodb-connection-string-url';

const RUN_SCRIPT_COMMAND = (connectionString: string) => `
mongosh "${redactConnectionString(connectionString)}" \\
  --username <your-username> \\
  --password "<your-password>" \\
  mockdatascript.js
`;

const outerSectionStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

const listStyles = css({
  listStylePosition: 'inside',
  listStyleType: 'disc',
  marginLeft: spacing[200],
});

const copyableStyles = css({
  marginLeft: spacing[400],
});

const sectionInstructionStyles = css({
  margin: `${spacing[200]}px 0`,
});

const resourceSectionStyles = css({
  padding: `${spacing[400]}px ${spacing[800]}px`,
  borderRadius: spacing[400],
});

const instructionTextStyle = css({
  marginTop: spacing[200],
});

const resourceSectionLightStyles = css({
  backgroundColor: palette.gray.light3,
});

const resourceSectionDarkStyles = css({
  backgroundColor: palette.gray.dark3,
});

const resourceSectionHeader = css({
  marginBottom: spacing[300],
});

const scriptCodeBlockStyles = css({
  maxHeight: '230px',
  overflowY: 'auto',
});

interface ScriptScreenProps {
  fakerSchema: FakerSchema | null;
  namespace: string;
  arrayLengthMap: ArrayLengthMap;
  documentCount: string;
}

const ScriptScreen = ({
  fakerSchema,
  namespace,
  arrayLengthMap,
  documentCount,
}: ScriptScreenProps) => {
  const { t } = useTranslation('compassCollection');
  const isDarkMode = useDarkMode();
  const connectionInfo = useConnectionInfo();
  const track = useTelemetry();

  const connectionString: string =
    connectionInfo?.atlasMetadata?.userConnectionString ??
    DEFAULT_CONNECTION_STRING_FALLBACK;

  const { database, collection } = toNS(namespace);

  // Generate the script using the faker schema
  const scriptResult = useMemo(() => {
    // Handle case where fakerSchema is not yet available
    if (!fakerSchema) {
      return {
        success: false as const,
        error: 'Faker schema not available',
      };
    }

    return generateScript(fakerSchema, {
      documentCount: Number(documentCount) || DEFAULT_DOCUMENT_COUNT,
      databaseName: database,
      collectionName: collection,
      arrayLengthMap,
    });
  }, [fakerSchema, documentCount, database, collection, arrayLengthMap]);

  const onScriptCopy = useCallback(
    ({ step }: { step: DataGenerationStep }) => {
      track('Mock Data Script Copied', {
        step: step,
      });
    },
    [track]
  );

  useTrackOnChange(
    (track: TrackFunction) => {
      if (scriptResult.success && fakerSchema) {
        track('Mock Data Script Generated', {
          field_count: Object.keys(fakerSchema).length,
          output_docs_count: Number(documentCount) || DEFAULT_DOCUMENT_COUNT,
        });
      }
    },
    [scriptResult.success, fakerSchema, documentCount]
  );

  return (
    <section className={outerSectionStyles}>
      <Body>{t('scriptIntroText')}</Body>
      {!scriptResult.success && (
        <Banner variant="danger">
          <strong>{t('scriptGenerationFailedTitle')}</strong>{' '}
          {scriptResult.error}
          <br />
          {t('scriptGenerationFailedNote')}
        </Banner>
      )}
      <section>
        <Body as="h2" baseFontSize={16} weight="medium">
          {t('prerequisitesTitle')}
        </Body>
        <Body className={instructionTextStyle}>{t('prerequisitesIntro')}</Body>
        <ul className={listStyles}>
          <li>
            <Trans
              i18nKey="installMongosh"
              ns="compassCollection"
              components={{
                mongoshLink: (
                  <Link href="https://www.mongodb.com/docs/mongodb-shell/install/" />
                ),
              }}
            />
          </li>
          <li>
            <Trans
              i18nKey="installFakerjs"
              ns="compassCollection"
              components={{
                fakerjsLink: (
                  <Link href="https://fakerjs.dev/guide/#installation" />
                ),
              }}
            />
            <Copyable
              className={copyableStyles}
              onCopy={() =>
                onScriptCopy({ step: DataGenerationSteps.INSTALL_FAKERJS })
              }
            >
              npm install @faker-js/faker@10
            </Copyable>
          </li>
        </ul>
      </section>
      <section>
        <Body as="h2" baseFontSize={16} weight="medium">
          {t('createJsFileTitle')}
        </Body>
        <Body className={sectionInstructionStyles}>
          <Trans
            i18nKey="createJsFileDescription"
            ns="compassCollection"
            components={{ strong: <strong /> }}
          />
        </Body>
        <Code
          copyButtonAppearance={scriptResult.success ? 'hover' : 'persist'}
          language={Language.JavaScript}
          className={scriptCodeBlockStyles}
          onCopy={() =>
            onScriptCopy({ step: DataGenerationSteps.CREATE_JS_FILE })
          }
        >
          {scriptResult.success
            ? scriptResult.script
            : t('scriptGenerationFailed')}
        </Code>
      </section>
      <section>
        <Body as="h2" baseFontSize={16} weight="medium">
          <Trans
            i18nKey="runScriptTitle"
            ns="compassCollection"
            components={{ mongosh: <InlineCode /> }}
          />
        </Body>
        <Body className={sectionInstructionStyles}>
          <Trans
            i18nKey="runScriptDescription"
            ns="compassCollection"
            components={{ strong: <strong />, em: <em /> }}
          />
        </Body>
        <Code
          language={Language.Bash}
          onCopy={() => onScriptCopy({ step: DataGenerationSteps.RUN_SCRIPT })}
        >
          {RUN_SCRIPT_COMMAND(connectionString)}
        </Code>
      </section>
      <section
        className={cx(
          resourceSectionStyles,
          isDarkMode ? resourceSectionDarkStyles : resourceSectionLightStyles
        )}
      >
        <Overline className={resourceSectionHeader}>
          {t('resourcesTitle')}
        </Overline>
        <ul>
          <li>
            <Link href="https://www.mongodb.com/docs/atlas/synthetic-data/">
              {t('resourceSyntheticData')}
            </Link>
          </li>
          <li>
            <Link href="https://www.mongodb.com/docs/mongodb-shell/">
              {t('resourceMongoShell')}
            </Link>
          </li>
          {connectionInfo.atlasMetadata &&
            connectionInfo.atlasMetadata.projectId && (
              <li>
                <Link
                  href={`${window.location.origin}/v2/${connectionInfo.atlasMetadata.projectId}#/security/database/users`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('resourceDatabaseUsers')}
                </Link>
              </li>
            )}
        </ul>
      </section>
    </section>
  );
};

const mapStateToProps = (state: CollectionState) => {
  const {
    fakerSchemaGeneration,
    namespace,
    schemaAnalysis,
    mockDataGenerator,
  } = state;

  return {
    fakerSchema:
      fakerSchemaGeneration.status === 'completed'
        ? fakerSchemaGeneration.fakerSchema
        : null,
    namespace,
    arrayLengthMap:
      schemaAnalysis?.status === SCHEMA_ANALYSIS_STATE_COMPLETE
        ? schemaAnalysis.arrayLengthMap
        : {},
    documentCount: mockDataGenerator.documentCount,
  };
};

const ConnectedScriptScreen = connect(mapStateToProps)(ScriptScreen);

export default ConnectedScriptScreen;
export type { ScriptScreenProps };
