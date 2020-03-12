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
          openLink={sinon.spy()}
          stageOperator="$match"
          isValid
          count={10}
          isEnabled />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the stage text', () => {
      expect(component.find(`.${styles['stage-preview-toolbar']}`)).
        to.include.text('(Sample of 10 documents)');
    });

    it('renders the stage text with the right link', () => {
      expect(component.find(`.${styles['stage-preview-toolbar-link']}`)).
        to.have.text('$match');
    });

    it('renders the info sprinkle', () => {
      expect(component.find('InfoSprinkle')).
        to.be.present();
      expect(component.find('InfoSprinkle').prop('helpLink')).
        to.include('/aggregation/match');
    });
  });

  context('does not break when the stage is invalid', () => {
    // While we constrain users to the stages in the dropdown
    // with 'Create pipeline from text' they are still able to import
    // pipelines with stages that are invalid. From analytics, it looks like
    // they actually do that sometimes. We want to make sure that when they do,
    // Compass does not completely break.


    let component;

    beforeEach(() => {
      component = shallow(
        <StagePreviewToolbar
          openLink={sinon.spy()}
          stageOperator="$monkey"
          isValid
          count={10}
          isEnabled />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the stage text', () => {
      expect(component.find(`.${styles['stage-preview-toolbar']}`)).
        to.include.text('(Sample of 10 documents)');
    });

    it('renders the stage text', () => {
      expect(component.find('.stage-preview-toolbar-link-invalid')).
        to.have.text('$monkey');
    });

    it('renders the info sprinkle', () => {
      expect(component.find('InfoSprinkle')).
        to.not.be.present();
    });
  });

  context('when the stage is not enabled', () => {
    let component;

    beforeEach(() => {
      component = shallow(
        <StagePreviewToolbar
          openLink={sinon.spy()}
          stageOperator="$match"
          isValid
          count={10}
          isEnabled={false} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('does not render the stage text', () => {
      expect(component.find(`.${styles['stage-preview-toolbar']}`)).
        to.have.text('Stage is disabled. Results not passed in the pipeline.');
    });
  });

  context('when the stage operator is $out', () => {
    context('when the value is a collection', () => {
      let component;

      beforeEach(() => {
        component = shallow(
          <StagePreviewToolbar
            openLink={sinon.spy()}
            stageOperator="$out"
            stageValue="collection"
            count={0}
            isValid
            isEnabled />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders the $out stage text', () => {
        expect(component.find(`.${styles['stage-preview-toolbar']}`)).
          to.have.text('Documents will be saved to the collection: collection');
      });
    });

    context('when the value is s3', () => {
      context('when the value is a string', () => {
        let component;

        beforeEach(() => {
          component = shallow(
            <StagePreviewToolbar
              openLink={sinon.spy()}
              stageOperator="$out"
              stageValue="{ s3: 'bucket' }"
              count={0}
              isValid
              isEnabled />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the $out stage text', () => {
          expect(component.find(`.${styles['stage-preview-toolbar']}`)).
            to.have.text('Documents will be saved to S3.');
        });
      });

      context('when the value is an object', () => {
        let component;

        beforeEach(() => {
          component = shallow(
            <StagePreviewToolbar
              openLink={sinon.spy()}
              stageOperator="$out"
              stageValue="{ s3: { bucket: 'test' }}"
              count={0}
              isValid
              isEnabled />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the $out stage text', () => {
          expect(component.find(`.${styles['stage-preview-toolbar']}`)).
            to.have.text('Documents will be saved to S3.');
        });
      });
    });

    context('when the value is atlas', () => {
      let component;

      beforeEach(() => {
        component = shallow(
          <StagePreviewToolbar
            openLink={sinon.spy()}
            stageOperator="$out"
            stageValue="{ atlas: { projectId: 'test' }}"
            count={0}
            isValid
            isEnabled />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders the $out stage text', () => {
        expect(component.find(`.${styles['stage-preview-toolbar']}`)).
          to.have.text('Documents will be saved to Atlas cluster.');
      });
    });
  });

  context('when there is no stage operator', () => {
    let component;

    beforeEach(() => {
      component = shallow(
        <StagePreviewToolbar
          openLink={sinon.spy()}
          stageOperator={null}
          count={0}
          isValid
          isEnabled />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the stage text', () => {
      expect(component.find(`.${styles['stage-preview-toolbar']}`)).
        to.have.text('A sample of the aggregated results from this stage will be shown below');
    });
  });
});
