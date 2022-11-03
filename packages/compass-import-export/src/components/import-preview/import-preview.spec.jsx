import React from 'react';
import { mount } from 'enzyme';

import ImportPreview from '.';
import createStyler from '../../utils/styler';
import styles from './import-preview.module.less';

let onFieldCheckedChangedSpy;
let setFieldTypeSpy;

import sinon from 'sinon';
import { expect } from 'chai';

describe('ImportPreview [Component]', function () {
  describe('not loaded', function () {
    let component;

    before(function () {
      onFieldCheckedChangedSpy = sinon.spy();
      setFieldTypeSpy = sinon.spy();

      component = mount(
        <ImportPreview
          fields={[['_id']]}
          values={[[1]]}
          loaded={false}
          onFieldCheckedChanged={onFieldCheckedChangedSpy}
          setFieldType={setFieldTypeSpy}
        />
      );
    });

    it('should not render', function () {
      const style = createStyler(styles, 'import-preview');
      expect(component.find(`.${style()}`)).to.not.be.present();
    });

    after(function () {
      component = null;
      onFieldCheckedChangedSpy = null;
      setFieldTypeSpy = null;
    });
  });

  describe('no fields (1)', function () {
    let component;

    before(function () {
      onFieldCheckedChangedSpy = sinon.spy();
      setFieldTypeSpy = sinon.spy();

      component = mount(
        <ImportPreview
          fields={null}
          values={[[1, 2]]}
          loaded
          onFieldCheckedChanged={onFieldCheckedChangedSpy}
          setFieldType={setFieldTypeSpy}
        />
      );
    });

    it('should not render', function () {
      const style = createStyler(styles, 'import-preview');
      expect(component.find(`.${style()}`)).to.not.be.present();
    });

    after(function () {
      component = null;
      onFieldCheckedChangedSpy = null;
      setFieldTypeSpy = null;
    });
  });

  describe('no fields (2)', function () {
    let component;

    before(function () {
      onFieldCheckedChangedSpy = sinon.spy();
      setFieldTypeSpy = sinon.spy();

      component = mount(
        <ImportPreview
          fields={[['_id']]}
          values={null}
          loaded
          onFieldCheckedChanged={onFieldCheckedChangedSpy}
          setFieldType={setFieldTypeSpy}
        />
      );
    });

    it('should not render', function () {
      const style = createStyler(styles, 'import-preview');
      expect(component.find(`.${style()}`)).to.not.be.present();
    });

    after(function () {
      component = null;
      onFieldCheckedChangedSpy = null;
      setFieldTypeSpy = null;
    });
  });
});
