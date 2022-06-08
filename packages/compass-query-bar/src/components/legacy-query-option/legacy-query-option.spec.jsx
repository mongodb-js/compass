import React from 'react';
import { shallow } from 'enzyme';
import { InfoSprinkle } from 'hadron-react-components';
import { expect } from 'chai';
import sinon from 'sinon';

import { QueryOption } from './legacy-query-option';

describe('QueryOption [Component]', function () {
  let onChangeStub;

  beforeEach(function () {
    onChangeStub = sinon.stub();
  });

  afterEach(function () {
    onChangeStub = null;
  });

  describe('#rendering', function () {
    it('should render a label and an input as children', function () {
      const component = shallow(
        <QueryOption
          label="Test"
          link="#"
          inputType="numeric"
          onChange={onChangeStub}
          placeholder=""
          value=""
          serverVersion="3.4.0"
          refreshEditorAction={() => {}}
          autoPopulated={false}
          hasToggle={false}
          hasError={false}
          schemaFields={[]}
        />
      );

      expect(
        component.find('[data-testid="query-bar-option"]').children()
      ).to.have.length(2);
      expect(
        component.find('[data-testid="query-bar-option"]').childAt(0)
      ).to.have.prop('data-testid', 'query-bar-option-label');
      expect(
        component.find('[data-testid="query-bar-option"]').childAt(1)
      ).to.have.prop('data-testid', 'query-bar-option-input');
    });

    it('should render the correct label text', function () {
      const component = shallow(
        <QueryOption
          label="Test"
          link="#"
          inputType="numeric"
          onChange={onChangeStub}
          placeholder=""
          serverVersion="3.4.0"
          value=""
          refreshEditorAction={() => {}}
          autoPopulated={false}
          hasToggle={false}
          hasError={false}
          schemaFields={[]}
        />
      );

      expect(
        component.find('[data-testid="query-bar-option-label"]')
      ).to.have.text('<InfoSprinkle />Test');
    });

    it('should render an InfoSprinkle with the correct help link', function () {
      const component = shallow(
        <QueryOption
          label="Test"
          link="#"
          inputType="numeric"
          onChange={onChangeStub}
          serverVersion="3.4.0"
          placeholder=""
          value=""
          refreshEditorAction={() => {}}
          autoPopulated={false}
          hasToggle={false}
          hasError={false}
          schemaFields={[]}
        />
      );

      expect(component.find(InfoSprinkle)).to.have.prop('helpLink', '#');
    });
  });
});
