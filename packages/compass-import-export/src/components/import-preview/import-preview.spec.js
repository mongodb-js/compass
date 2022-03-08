import React from 'react';
import { mount } from 'enzyme';

import ImportPreview from './';
import createStyler from '../../utils/styler.js';
import styles from './import-preview.module.less';

let onFieldCheckedChangedSpy;
let setFieldTypeSpy;

describe('ImportPreview [Component]', () => {
  describe('not loaded', () => {
    let component;

    before(() => {
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

    it('should not render', () => {
      const style = createStyler(styles, 'import-preview');
      expect(component.find(`.${style()}`)).to.not.be.present();
    });

    after(() => {
      component = null;
      onFieldCheckedChangedSpy = null;
      setFieldTypeSpy = null;
    });
  });

  describe('no fields', () => {
    let component;

    before(() => {
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

    it('should not render', () => {
      const style = createStyler(styles, 'import-preview');
      expect(component.find(`.${style()}`)).to.not.be.present();
    });

    after(() => {
      component = null;
      onFieldCheckedChangedSpy = null;
      setFieldTypeSpy = null;
    });
  });

  describe('no fields', () => {
    let component;

    before(() => {
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

    it('should not render', () => {
      const style = createStyler(styles, 'import-preview');
      expect(component.find(`.${style()}`)).to.not.be.present();
    });

    after(() => {
      component = null;
      onFieldCheckedChangedSpy = null;
      setFieldTypeSpy = null;
    });
  });
});
