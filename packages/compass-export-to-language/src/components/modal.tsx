import React, { useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import jsBeautify from 'js-beautify';
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
import { modalOpenChanged } from '../modules/modal-open';
import {
  outputLanguageToCodeLanguage,
  codeLanguageToOutputLanguage,
} from '../modules/languages';
import type { OutputLanguage } from '../modules/languages';
import {
  getInputExpressionMode,
  isQuery,
  runTranspiler,
} from '../modules/transpiler';
import type { InputExpression } from '../modules/transpiler';

import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { countAggregationStagesInString } from '../modules/count-aggregation-stages-in-string';
const { track } = createLoggerAndTelemetry('COMPASS-EXPORT-TO-LANGUAGE-UI');

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
  } catch (ignore) {
    // Things like [{ $match: { x: NumberInt(10) } }] do not evaluate in any kind of context
    return { num_stages: -1 };
  }
}

const ExportToLanguageModal: React.FunctionComponent<
  ExportToLanguageState & {
    modalOpenChanged: (isOpen: boolean) => void;
  }
> = ({ modalOpen, modalOpenChanged, inputExpression, uri, namespace }) => {
  const [outputLanguage, setOutputLanguage] =
    useState<OutputLanguage>('python');
  const [includeImports, setIncludeImports] = useState<boolean>(false);
  const [includeDrivers, setIncludeDrivers] = useState<boolean>(false);
  const [useBuilders, setUseBuilders] = useState<boolean>(false);

  const mode = getInputExpressionMode(inputExpression);

  const onClose = () => {
    modalOpenChanged(false);
  };

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
  ]);

  const includeUseBuilders = outputLanguage === 'java' && isQuery(mode);

  const input =
    'aggregation' in inputExpression
      ? inputExpression.aggregation
      : inputExpression.filter;

  const [wasOpen, setWasOpen] = useState(false);

  useEffect(() => {
    const trackingEvent =
      mode === 'Update Query'
        ? 'Update Export Opened'
        : mode === 'Delete Query'
        ? 'Delete Export Opened'
        : mode === 'Query'
        ? 'Query Export Opened'
        : 'Aggregation Export Opened';

    if (modalOpen && !wasOpen) {
      track(trackingEvent, {
        ...stageCountForTelemetry(inputExpression),
      });
      track('Screen', { name: 'export_to_language_modal' });
    }

    setWasOpen(modalOpen);
  }, [modalOpen, wasOpen, mode, inputExpression]);

  function trackCopiedOutput() {
    const trackingEvent =
      mode === 'Update Query'
        ? 'Update Exported'
        : mode === 'Delete Query'
        ? 'Delete Exported'
        : mode === 'Query'
        ? 'Query Exported'
        : 'Aggregation Exported';

    track(trackingEvent, {
      language: outputLanguage,
      with_import_statements: includeImports,
      with_drivers_syntax: includeDrivers,
      with_builders: useBuilders,
      ...stageCountForTelemetry(inputExpression),
    });
  }

  return (
    <InfoModal
      data-testid="export-to-language-modal"
      open={modalOpen}
      onClose={onClose}
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
              return;
            }}
            language="Shell"
            copyable={true}
          >
            {mode === 'Query' ? jsBeautify(input, { indent_size: 2 }) : input}
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

const mapStateToProps = (state: ExportToLanguageState) => ({
  modalOpen: state.modalOpen,
  inputExpression: state.inputExpression,
  uri: state.uri,
  namespace: state.namespace,
});

const MappedExportToLanguageModal = connect(mapStateToProps, {
  modalOpenChanged,
})(ExportToLanguageModal);

export default MappedExportToLanguageModal;
