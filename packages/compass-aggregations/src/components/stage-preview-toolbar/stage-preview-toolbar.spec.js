import React from 'react';
import { shallow } from 'enzyme';

import StagePreviewToolbar from 'components/stage-preview-toolbar';
import styles from './stage-preview-toolbar.less';

describe('StagePreviewToolbar [Component]', () => {
  context('when the stage is enabled', () => {
    let component;

    beforeEach(() => {
      component = shallow(
        <StagePreviewToolbar
          stageOperator="$match"
          isEnabled />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the wrapper div', () => {
      expect(component.find(`.${styles['stage-preview-toolbar']}`)).to.be.present();
    });

    it('renders the stage text', () => {
      expect(component.find(`.${styles['stage-preview-toolbar']}`)).
        to.have.text('Sample of Documents after the $match stage');
    });
  });

  context('when the stage is not enabled', () => {
    let component;

    beforeEach(() => {
      component = shallow(
        <StagePreviewToolbar
          stageOperator="$match"
          isEnabled={false} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the wrapper div', () => {
      expect(component.find(`.${styles['stage-preview-toolbar']}`)).to.be.present();
    });

    it('does not render the stage text', () => {
      expect(component.find(`.${styles['stage-preview-toolbar']}`)).
        to.have.text('Stage is disabled. Results not passed in the pipeline.');
    });
  });
});
