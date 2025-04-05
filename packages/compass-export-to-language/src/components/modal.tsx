import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import {
  InfoModal,
  css,
  Label,
  Code,
  Checkbox,
  Banner,
  spacing,
  FormFieldContainer,
} from '@mongodb-js/compass-components';
import type { Language } from '@mongodb-js/compass-components';
import {
  outputLanguageToCodeLanguage,
  codeLanguageToOutputLanguage,
} from '../modules/languages';
import type { OutputLanguage } from '../modules/languages';
import { isQueryExpression, runTranspiler } from '../modules/transpiler';
import type { InputExpression } from '../modules/transpiler';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { countAggregationStagesInString } from '../modules/count-aggregation-stages-in-string';
import { usePreference } from 'compass-preferences-model/provider';
import { prettify } from '@mongodb-js/compass-editor';
import { closeModal } from '../stores';
import { useConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

type LanguageOption = {
  displayName: string;
  language: Language;
};

const languageOptions: LanguageOption[] = [
  { displayName: 'Java', language: 'java' },
  { displayName: 'Node', language: 'javascript' },
  { displayName: 'C#', language: 'cs' },
  { displayName: 'Python', language: 'python' },
  { displayName: 'Ruby', language: 'ruby' },
  { displayName: 'Go', language: 'go' },
  { displayName: 'Rust', language: 'rust' },
  { displayName: 'PHP', language: 'php' },
];

const shellLanguageOptions: LanguageOption[] = [
  { displayName: 'Shell', language: 'javascript' },
];

type ExportToLanguageState = {
  modalOpen: boolean;
  inputExpression: InputExpression;
  uri: string;
  namespace: string;
};

const bannerStyles = css({
  marginBottom: spacing[3],
});

const formFieldContainerStyles = css({
  display: 'flex',
  gap: spacing[4],
});

const fieldStyles = css({
  flex: '1 1 0px',
});

const editorHeadingStyles = css({
  marginBottom: spacing[2],
  display: 'block',
});

const codeStyles = css({
  alignItems: 'start',
  height: `${spacing[6] * 4 - spacing[5]}px`,
});

const checkboxStyles = css({
  marginTop: spacing[2],
  width: 'auto', // don't overflow and cause extra scrollbars
});

function stageCountForTelemetry(inputExpression: InputExpression) {
  if (!('aggregation' in inputExpression)) {
    return {};
  }

  try {
    return {
      num_stages: countAggregationStagesInString(inputExpression.aggregation),
    };
  } catch {
    // Things like [{ $match: { x: NumberInt(10) } }] do not evaluate in any kind of context
    return { num_stages: -1 };
  }
}

const ExportToLanguageModal: React.FunctionComponent<
  ExportToLanguageState & {
    onModalClose: () => void;
  }
> = ({ modalOpen, onModalClose, inputExpression, uri, namespace }) => {
  const track = useTelemetry();
  const connectionInfoRef = useConnectionInfoRef();
  const [outputLanguage, setOutputLanguage] =
    useState<OutputLanguage>('python');
  const [includeImports, setIncludeImports] = useState<boolean>(false);
  const [includeDrivers, setIncludeDrivers] = useState<boolean>(false);
  const [useBuilders, setUseBuilders] = useState<boolean>(false);

  const mode = inputExpression.exportMode;
  const isQuery = isQueryExpression(inputExpression);

  const protectConnectionStrings = !!usePreference('protectConnectionStrings');
  const [transpiledExpression, errorMessage] = useMemo(() => {
    try {
      const output = runTranspiler({
        inputExpression,
        outputLanguage,
        includeImports,
        includeDrivers,
        useBuilders,
        uri,
        namespace,
        protectConnectionStrings,
      });
      return [output, null];
    } catch (e) {
      return [null, (e as Error)?.message];
    }
  }, [
    includeDrivers,
    includeImports,
    inputExpression,
    namespace,
    outputLanguage,
    uri,
    useBuilders,
    protectConnectionStrings,
  ]);

  const includeUseBuilders = outputLanguage === 'java' && isQuery;

  const input = isQuery ? inputExpression.filter : inputExpression.aggregation;

  const [wasOpen, setWasOpen] = useState(false);

  useEffect(() => {
    if (modalOpen && !wasOpen) {
      const connectionInfo = connectionInfoRef.current;

      if (mode === 'Query') {
        track('Query Export Opened', {}, connectionInfo);
      } else if (mode === 'Delete Query') {
        track('Delete Export Opened', {}, connectionInfo);
      } else if (mode === 'Update Query') {
        track('Update Export Opened', {}, connectionInfo);
      } else if (mode === 'Pipeline') {
        track(
          'Aggregation Export Opened',
          {
            ...stageCountForTelemetry(inputExpression),
          },
          connectionInfo
        );
      }

      track('Screen', { name: 'export_to_language_modal' }, connectionInfo);
    }

    setWasOpen(modalOpen);
  }, [modalOpen, wasOpen, mode, inputExpression, track, connectionInfoRef]);

  const trackCopiedOutput = useCallback(() => {
    const commonProps = {
      language: outputLanguage,
      with_import_statements: includeImports,
      with_drivers_syntax: includeDrivers,
      with_builders: useBuilders,
    };

    if (mode === 'Update Query') {
      track('Update Exported', commonProps, connectionInfoRef.current);
    } else if (mode === 'Delete Query') {
      track('Delete Exported', commonProps, connectionInfoRef.current);
    } else if (mode === 'Query') {
      track('Query Exported', commonProps, connectionInfoRef.current);
    } else if (mode === 'Pipeline') {
      track(
        'Aggregation Exported',
        {
          ...commonProps,
          ...stageCountForTelemetry(inputExpression),
        },
        connectionInfoRef.current
      );
    }
  }, [
    track,
    connectionInfoRef,
    outputLanguage,
    includeImports,
    includeDrivers,
    useBuilders,
    inputExpression,
    mode,
  ]);

  const prettyInput = useMemo(() => {
    return prettify(input, 'javascript-expression');
  }, [input]);

  return (
    <InfoModal
      data-testid="export-to-language-modal"
      open={modalOpen}
      onClose={onModalClose}
      title={`Export ${mode} To Language`}
      size="large"
    >
      {errorMessage && (
        <Banner variant="danger" className={bannerStyles}>
          {errorMessage}
        </Banner>
      )}

      <FormFieldContainer className={formFieldContainerStyles}>
        <div
          className={fieldStyles}
          data-testid="export-to-language-input-field"
        >
          <Label
            data-testid="export-to-language-export-from"
            htmlFor="export-to-language-input"
            className={editorHeadingStyles}
          >
            My {mode}
          </Label>
          <Code
            className={codeStyles}
            id="export-to-language-input"
            data-testid="export-to-language-input"
            languageOptions={shellLanguageOptions}
            onChange={() => {
              // There is only one language option and we don't allow to change
              // the value
            }}
            language="Shell"
            copyable={true}
          >
            {prettyInput}
          </Code>
        </div>
        <div
          className={fieldStyles}
          data-testid="export-to-language-output-field"
        >
          <Label
            data-testid="export-to-language-export-to-label"
            htmlFor="export-to-language-output"
            className={editorHeadingStyles}
          >
            Exported {mode}
          </Label>
          <Code
            className={codeStyles}
            id="export-to-language-output"
            data-testid="export-to-language-output"
            languageOptions={languageOptions}
            onChange={(option: LanguageOption) =>
              setOutputLanguage(codeLanguageToOutputLanguage(option.language))
            }
            language={outputLanguageToCodeLanguage(outputLanguage)}
            copyable={true}
            onCopy={trackCopiedOutput}
          >
            {transpiledExpression || ''}
          </Code>
        </div>
      </FormFieldContainer>

      <Checkbox
        className={checkboxStyles}
        data-testid="export-to-language-include-imports"
        onChange={() => setIncludeImports(!includeImports)}
        label="Include Import Statements"
        checked={includeImports}
        bold={false}
      />

      <Checkbox
        className={checkboxStyles}
        data-testid="export-to-language-include-drivers"
        onChange={() => setIncludeDrivers(!includeDrivers)}
        label="Include Driver Syntax"
        checked={includeDrivers}
        bold={false}
      />

      {includeUseBuilders && (
        <Checkbox
          className={checkboxStyles}
          data-testid="export-to-language-use-builders"
          onChange={() => setUseBuilders(!useBuilders)}
          label="Use Builders"
          checked={useBuilders}
          bold={false}
        />
      )}
    </InfoModal>
  );
};

const mapStateToProps = (
  state: ExportToLanguageState,
  // So that the connected component types are correctly derived
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _ownProps: { namespace: string }
) => ({
  modalOpen: state.modalOpen,
  inputExpression: state.inputExpression,
  uri: state.uri,
  namespace: state.namespace,
});

const MappedExportToLanguageModal = connect(mapStateToProps, {
  onModalClose: closeModal,
})(ExportToLanguageModal);

export default MappedExportToLanguageModal;
