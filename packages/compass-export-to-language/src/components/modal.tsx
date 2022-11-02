import React, { useMemo, useState } from 'react';
import { connect } from 'react-redux';
import toNS from 'mongodb-ns';
import compiler from 'bson-transpilers';
import jsBeautify from 'js-beautify';
import {
  InfoModal,
  css,
  Body,
  Select,
  Option,
  Code,
  Checkbox,
  Banner,
  spacing,
  SelectSize
} from '@mongodb-js/compass-components';
import { modalOpenChanged } from '../modules/modal-open';

// TODO: bring back the tracking that the old export modal had around opening the modal and copying the text

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
  marginBottom: spacing[3]
});

const editorsStyles = css({
  display: 'flex',
  gap: spacing[3]
});

const editorStyles = css({
  flex: '1 1 0px',
});

const editorHeadingStyles = css({
  marginBottom: spacing[2],
  flex: 1,
});

const outputHeadingStyles = css({
  display: 'flex',
  gap: spacing[2],
});

const selectStyles = css({
  width: spacing[6]*2,
});

const codeStyles = css({
  height: '250px',
  alignItems: 'start',
});

const checkboxStyles = css({
  marginTop: spacing[2],
  // prevent an extra couple of pixels that always causes the modal to scroll unnecessarily
  overflow: 'hidden'
});

function outputLanguageToCodeLanguage(language: OutputLanguage) {
  if (language === 'csharp') {
    return 'cs';
  }

  if (['', 'rust'].includes(language)) {
    return 'none';
  }

  return language;
}

const ExportToLanguageModal: React.FunctionComponent<
  ExportToLanguageState & {
    modalOpenChanged: (isOpen: boolean) => void;
  }
> = ({
  modalOpen,
  modalOpenChanged,
  inputExpression,
  uri,
  namespace,
}) => {
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

  const input = 'aggregation' in inputExpression ? inputExpression.aggregation : inputExpression.filter;

  return (
    <InfoModal
      open={modalOpen}
      onClose={onClose}
      title={`Export ${mode} To Language`}
      size="large"

    >
      {errorMessage && <Banner variant="danger" className={bannerStyles}>{errorMessage}</Banner>}
      <div className={editorsStyles}>
        <div className={editorStyles}>
          <Body data-testid="export-to-language-export-from" className={editorHeadingStyles}>My {mode}:</Body>
          <Code
            className={codeStyles}
            data-testid="export-to-language-input"
            language="javascript"
            copyable={true}
          >
            {jsBeautify(input, null, 2)}
          </Code>
        </div>
        <div className={editorStyles}>
          <div className={outputHeadingStyles}>
            <Body id="export-to-language-export-to" className={editorHeadingStyles}>Export {mode} to:</Body>
            <Select
              className={selectStyles}
              aria-labelledby="export-to-language-export-to"
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
          </div>
          <Code
            className={codeStyles}
            data-testid="export-to-language-output"
            language={outputLanguageToCodeLanguage(outputLanguage)}
            copyable={true}
          >
            {transpiledExpression || ''}
          </Code>

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
        </div>
      </div>
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
