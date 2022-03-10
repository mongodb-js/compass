import { mount } from 'enzyme';

import createStyler from '../../utils/styler.js';
import styles from './import-preview.module.less';
import * as sinon from 'sinon';
import { expect } from 'chai';
import React from 'react';
import ImportPreview from './';

let onFieldCheckedChangedSpy;
let setFieldTypeSpy;

describe('ImportPreview [Component]', function() {
  describe('not loaded', function() {
    let component;

    before(function() {
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

    it('should not render', function() {
      const style = createStyler(styles, 'import-preview');
      expect(component.find(`.${style()}`)).to.not.be.present();
    });

    after(function() {
      component = null;
      onFieldCheckedChangedSpy = null;
      setFieldTypeSpy = null;
    });
  });

  describe('no fields', function() {
    let component;

    before(function() {
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

    it('should not render', function() {
      const style = createStyler(styles, 'import-preview');
      expect(component.find(`.${style()}`)).to.not.be.present();
    });

    after(function() {
      component = null;
      onFieldCheckedChangedSpy = null;
      setFieldTypeSpy = null;
    });
  });

  describe('_id fields', function() {
    let component;

    before(function() {
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

    it('should not render', function() {
      const style = createStyler(styles, 'import-preview');
      expect(component.find(`.${style()}`)).to.not.be.present();
    });

    after(function() {
      component = null;
      onFieldCheckedChangedSpy = null;
      setFieldTypeSpy = null;
    });
  });
});
