import React, { useMemo, useState } from 'react';
import { connect } from 'react-redux';
import toNS from 'mongodb-ns';
import compiler from 'bson-transpilers';
import jsBeautify from 'js-beautify';
import {
  InfoModal,
  css,
  cx,
  Label,
  Code,
  Checkbox,
  Banner,
  spacing,
} from '@mongodb-js/compass-components';
import type { Language } from '@mongodb-js/compass-components';
import { modalOpenChanged } from '../modules/modal-open';

// TODO: bring back the tracking that the old export modal had around opening the modal and copying the text

type LanguageOption = {
  displayName: string;
  language: Language;
}

const languageOptions: LanguageOption[] = [
  { displayName: 'Java', language: 'java' },
  { displayName: 'Javascript', language: 'javascript' },
  { displayName: 'C#', language: 'cs' },
  { displayName: 'Python', language: 'python' },
  { displayName: 'Ruby', language: 'ruby' },
  { displayName: 'Go', language: 'go' },
  { displayName: 'Rust', language: 'rust' },
  { displayName: 'PHP', language: 'php' }
];

type AggregationExpression = {
  aggregation: string;
};

type QueryExpression = {
  filter: string;
  project?: string;
  sort?: string;
  collation?: string;
  skip?: string;
  limit?: string;
  maxTimeMS?: string;
};

type InputExpression = AggregationExpression | QueryExpression;

type OutputLanguage =
  | 'java'
  | 'javascript'
  | 'csharp'
  | 'python'
  | 'ruby'
  | 'go'
  | 'rust'
  | 'php';

type ExportToLanguageState = {
  modalOpen: boolean;
  inputExpression: InputExpression;
  uri: string;
  namespace: string;
};

function getInputExpressionMode(inputExpression: InputExpression) {
  if ('filter' in inputExpression) {
    return 'Query';
  }
  return 'Pipeline';
}

type RunTranspilerOptions = {
  inputExpression: InputExpression;
  outputLanguage: OutputLanguage;
  includeImports: boolean;
  includeDrivers: boolean;
  useBuilders: boolean;
  uri: string;
  namespace: string;
};

function runTranspiler({
  inputExpression,
  outputLanguage,
  includeImports,
  includeDrivers,
  useBuilders,
  uri,
  namespace,
}: RunTranspilerOptions) {
  const mode = getInputExpressionMode(inputExpression);

  useBuilders =
    useBuilders && !(outputLanguage === 'java' && mode === 'Pipeline');

  let output = '';

  if (includeImports) {
    output += compiler.shell[outputLanguage].getImports(includeDrivers);
    output += '\n\n';
  }

  if (includeDrivers) {
    const ns = toNS(namespace);
    const toCompile = Object.assign(
      {
        options: {
          collection: ns.collection,
          database: ns.database,
          uri,
        },
      },
      inputExpression
    );
    output += compiler.shell[outputLanguage].compileWithDriver(
      toCompile,
      useBuilders
    );
    return output;
  }

  // TODO: what should we do about the fact that compile() ignores everything
  // except 'filter' for queries? (ie. projection, sort, etc) whereas
  // compileWithDriver() takes all that into account?
  const toCompile =
    'aggregation' in inputExpression
      ? inputExpression.aggregation
      : inputExpression.filter;
  output += compiler.shell[outputLanguage].compile(
    toCompile,
    useBuilders,
    false
  );

  return output;
}

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
});

const inputStyles = css({
  height: `${spacing[6]*2 + 40}px`,
});

const outputStyles = css({
  height: spacing[6]*2,
});

const firstCheckboxStyles = css({
  marginTop: spacing[4],
});

const checkboxStyles = css({
  marginTop: spacing[2],
  // prevent an extra couple of pixels that always causes the modal to scroll unnecessarily
  overflow: 'hidden',
});

function outputLanguageToCodeLanguage(language: OutputLanguage) {
  if (language === 'csharp') {
    return 'C#';
  }

  if (language === 'php') {
    return 'PHP';
  }

  return language[0].toUpperCase()+language.slice(1);
}

function codeLanguageToOutputLanguage(language: string) {

  if (language === 'cs') {
    return 'csharp';
  }

  return language;
}

/*

            <Select
              className={selectStyles}
              aria-labelledby="export-to-language-export-to-label"
              size={SelectSize.XSmall}
              value={outputLanguage}
              onChange={(value) => setOutputLanguage(value as OutputLanguage)}
              allowDeselect={false}
            >
              <Option value="csharp">C#</Option>
              <Option value="go">Go</Option>
              <Option value="java">Java</Option>
              <Option value="javascript">Node</Option>
              <Option value="php">PHP</Option>
              <Option value="python">Python</Option>
              <Option value="ruby">Ruby</Option>
              <Option value="rust">Rust</Option>
            </Select>
*/

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
      <div className={editorsStyles}>
        <div className={editorStyles}>
          <Label
            data-testid="export-to-language-export-from"
            htmlFor="export-to-language-input"
            className={editorHeadingStyles}
          >
            My {mode}
          </Label>
          <Code
            className={cx(codeStyles, inputStyles)}
            id="export-to-language-input"
            data-testid="export-to-language-input"
            language="javascript"
            copyable={true}
          >
            {jsBeautify(input, null, 2)}
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
            className={cx(codeStyles, outputStyles)}
            id="export-to-language-output"
            data-testid="export-to-language-output"
            languageOptions={languageOptions}
            onChange={(option: LanguageOption) => setOutputLanguage(codeLanguageToOutputLanguage(option.language) as OutputLanguage)}
            language={outputLanguageToCodeLanguage(outputLanguage)}
            copyable={true}
          >
            {transpiledExpression || ''}
          </Code>
        </div>
      </div>
      <Checkbox
        className={cx(checkboxStyles, firstCheckboxStyles)}
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
