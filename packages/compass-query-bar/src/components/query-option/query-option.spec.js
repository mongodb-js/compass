import React from 'react';
import { shallow } from 'enzyme';
import { InfoSprinkle } from 'hadron-react-components';
import CodeMirror from 'components/codemirror';

// Mockout some of QueryOptions's dependencies via the webpack inject-loader
import QueryOptionInjector from 'inject-loader!components/query-option/query-option';

// We have to mock out these dependencies because because the electron shell is undefined when run outside
// the context of the electron renderer - which would result in an error being thrown in these component
// unit tests.

// eslint-disable-next-line new-cap
const { QueryOption } = QueryOptionInjector({
  'electron': {
    shell: {
      openExternal: () => {}
    }
  }
});

const inputTypeTests = [
  { inputType: 'numeric', label: 'foo', expected: { inputRenderFunc: '_renderSimpleInput', type: 'input' } },
  { inputType: 'boolean', label: 'foo', expected: { inputRenderFunc: '_renderCheckboxInput', type: 'input' } },

  { inputType: 'numeric', label: 'filter', expected: { inputRenderFunc: '_renderAutoCompleteInput', type: CodeMirror } },
  { inputType: 'boolean', label: 'filter', expected: { inputRenderFunc: '_renderAutoCompleteInput', type: CodeMirror } },

  { inputType: 'numeric', label: 'project', expected: { inputRenderFunc: '_renderAutoCompleteInput', type: CodeMirror } },
  { inputType: 'boolean', label: 'project', expected: { inputRenderFunc: '_renderAutoCompleteInput', type: CodeMirror } },

  { inputType: 'numeric', label: 'sort', expected: { inputRenderFunc: '_renderAutoCompleteInput', type: CodeMirror } },
  { inputType: 'boolean', label: 'sort', expected: { inputRenderFunc: '_renderAutoCompleteInput', type: CodeMirror } }
];

describe('QueryOption [Component]', function() {
  let validationFuncStub;
  let onChangeStub;

  beforeEach(function() {
    validationFuncStub = sinon.stub();
    onChangeStub = sinon.stub();
  });

  afterEach(function() {
    validationFuncStub = null;
    onChangeStub = null;
  });

  describe('#rendering', function() {
    it('should render a label and an input as children', function() {
      const component = shallow(
        <QueryOption
          label="Test"
          link="#"
          inputType="numeric"
          validationFunc={validationFuncStub}
          onChange={onChangeStub}
          placeholder=""
          value=""
          autoPopulated={false}
          hasToggle={false}
          hasError={false}
          schemaFields={{}} />
      );

      expect(component.find('[data-test-id="query-bar-option"]').children()).to.have.length(2);
      expect(component.find('[data-test-id="query-bar-option"]').childAt(0)).to.have.prop('data-test-id', 'query-bar-option-label');
      expect(component.find('[data-test-id="query-bar-option"]').childAt(1)).to.have.prop('data-test-id', 'query-bar-option-input');
    });

    it('should render the correct label text', function() {
      const component = shallow(
        <QueryOption
          label="Test"
          link="#"
          inputType="numeric"
          validationFunc={validationFuncStub}
          onChange={onChangeStub}
          placeholder=""
          value=""
          autoPopulated={false}
          hasToggle={false}
          hasError={false}
          schemaFields={{}} />
      );

      expect(component.find('[data-test-id="query-bar-option-label"]')).to.have.text('<InfoSprinkle />Test');
    });

    it('should render an InfoSprinkle with the correct help link', function() {
      const component = shallow(
        <QueryOption
          label="Test"
          link="#"
          inputType="numeric"
          validationFunc={validationFuncStub}
          onChange={onChangeStub}
          placeholder=""
          value=""
          autoPopulated={false}
          hasToggle={false}
          hasError={false}
          schemaFields={{}} />
      );

      expect(component.find(InfoSprinkle)).to.have.prop('helpLink', '#');
    });

    describe('when rendering the input', function() {
      inputTypeTests.forEach(function(test) {
        describe(`with props: { inputType: "${test.inputType}", label: "${test.label}" }`, function() {
          let inputRenderSpy;
          let component;

          beforeEach(function() {
            inputRenderSpy = sinon.spy(QueryOption.prototype, test.expected.inputRenderFunc);

            component = shallow(
              <QueryOption
                label={test.label}
                link="#"
                inputType={test.inputType}
                validationFunc={validationFuncStub}
                onChange={onChangeStub}
                placeholder="Test Placeholder"
                value=""
                autoPopulated={false}
                hasToggle={false}
                hasError={false}
                schemaFields={{}} />
            );
          });

          afterEach(function() {
            QueryOption.prototype[test.expected.inputRenderFunc].restore();

            inputRenderSpy = null;
            component = null;
          });

          it(`should call "${test.expected.inputRenderFunc}" to render the input element`, function() {
            inputRenderSpy.should.have.been.calledOnce; // eslint-disable-line no-unused-expressions
          });

          it('should render the correct type of input', function() {
            expect(component.find('[data-test-id="query-bar-option-input"]')).to.be.type(test.expected.type);
          });
        });
      });
    });
  });

  describe('#behaviour', function() {
    describe('when interacting with the component', function() {
      inputTypeTests.forEach(function(test) {
        describe(`with props: { inputType: "${test.inputType}", label: "${test.label}" }`, function() {
          let component;

          beforeEach(function() {
            component = shallow(
              <QueryOption
                label={test.label}
                link="#"
                inputType={test.inputType}
                validationFunc={validationFuncStub}
                onChange={onChangeStub}
                placeholder="Test Placeholder"
                value=""
                autoPopulated={false}
                hasToggle={false}
                hasError={false}
                schemaFields={{}} />
            );
          });

          afterEach(function() {
            component = null;
          });

          it('should call the onChange handler when the value on the input changes', function() {
            const event = { target: { value: 'foo' } };
            const inputNode = component.find('[data-test-id="query-bar-option-input"]');

            inputNode.simulate('change', event);
            onChangeStub.should.have.been.calledOnce; // eslint-disable-line no-unused-expressions
          });
        });
      });
    });
  });
});
