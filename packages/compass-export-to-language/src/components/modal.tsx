import React, { useMemo, useState } from 'react';
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
import { getInputExpressionMode, runTranspiler } from '../modules/transpiler';
import type { InputExpression, OutputLanguage } from '../modules/transpiler';

// TODO: bring back the tracking that the old export modal had around opening the modal and copying the text

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

const editorsStyles = css({
  display: 'flex',
  gap: spacing[4],
});

const editorStyles = css({
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
  // prevent an extra couple of pixels that always causes the modal to scroll unnecessarily
  overflow: 'hidden',
});

export function outputLanguageToCodeLanguage(language: OutputLanguage) {
  if (language === 'csharp') {
    return 'C#';
  }

  if (language === 'javascript') {
    return 'Node';
  }

  if (language === 'php') {
    return 'PHP';
  }

  return (language as string)[0].toUpperCase() + (language as string).slice(1);
}

export function codeLanguageToOutputLanguage(language: string): OutputLanguage {
  if (language === 'cs') {
    return 'csharp';
  }

  return language as OutputLanguage;
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

  const includeUseBuilders = outputLanguage === 'java' && mode === 'Query';

  const input =
    'aggregation' in inputExpression
      ? inputExpression.aggregation
      : inputExpression.filter;

  return (
    <InfoModal
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

      <FormFieldContainer className={editorsStyles}>
        <div className={editorStyles}>
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
            {mode === 'Query' ? jsBeautify(input, null, 2) : input}
          </Code>
        </div>
        <div className={editorStyles}>
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
