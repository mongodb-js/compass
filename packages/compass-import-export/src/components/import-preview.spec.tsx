import React from 'react';
import { render, screen } from '@testing-library/react';
import sinon from 'sinon';
import { expect } from 'chai';

import { ImportPreview } from './import-preview';

const testText = 'Specify Fields and Types';

const testField = {
  path: '_id',
  checked: true,
  type: 'String',
};

describe('ImportPreview [Component]', function () {
  let onFieldCheckedChangedSpy: sinon.SinonSpy;
  let setFieldTypeSpy: sinon.SinonSpy;

  beforeEach(function () {
    onFieldCheckedChangedSpy = sinon.spy();
    setFieldTypeSpy = sinon.spy();
  });

  describe('not loaded', function () {
    before(function () {
      render(
        <ImportPreview
          fields={[testField]}
          values={[[1 as any]]}
          loaded={false}
          onFieldCheckedChanged={onFieldCheckedChangedSpy}
          setFieldType={setFieldTypeSpy}
        />
      );
    });

    it('should not render', function () {
      expect(screen.queryByText(testText)).to.not.exist;
    });
  });

  describe('no fields (1)', function () {
    before(function () {
      render(
        <ImportPreview
          fields={null as any}
          values={[[1, 2] as any]}
          loaded
          onFieldCheckedChanged={onFieldCheckedChangedSpy}
          setFieldType={setFieldTypeSpy}
        />
      );
    });

    it('should not render', function () {
      expect(screen.queryByText(testText)).to.not.exist;
    });
  });

  describe('no fields (2)', function () {
    before(function () {
      render(
        <ImportPreview
          fields={[testField]}
          values={null as any}
          loaded
          onFieldCheckedChanged={onFieldCheckedChangedSpy}
          setFieldType={setFieldTypeSpy}
        />
      );
    });

    it('should not render', function () {
      expect(screen.queryByText(testText)).to.not.exist;
    });
  });

  describe('loaded', function () {
    before(function () {
      render(
        <ImportPreview
          fields={[testField]}
          values={
            [
              {
                _id: 25,
              },
            ] as any
          }
          loaded
          onFieldCheckedChanged={onFieldCheckedChangedSpy}
          setFieldType={setFieldTypeSpy}
        />
      );
    });

    it('should render', function () {
      expect(screen.queryByText(testText)).to.be.visible;
    });
  });
});
