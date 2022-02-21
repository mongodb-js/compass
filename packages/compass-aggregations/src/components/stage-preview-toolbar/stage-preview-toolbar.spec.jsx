import React from 'react';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import StagePreviewToolbar from '../stage-preview-toolbar';
import styles from './stage-preview-toolbar.module.less';

describe('StagePreviewToolbar [Component]', function() {
  context('when the stage is enabled', function() {
    let component;

    beforeEach(function() {
      component = mount(
        <StagePreviewToolbar
          openLink={sinon.spy()}
          stageOperator="$match"
          isValid
          count={10}
          isEnabled />
      );
    });

    afterEach(function() {
      if (component) {
        component.unmount();
        component = null;
      }
    });

    it('renders the stage text', function() {
      expect(component.find(`.${styles['stage-preview-toolbar']}`)).
        to.include.text('(Sample of 10 documents)');
    });

    it('renders the stage text with the right link', function() {
      expect(component.text()).
        to.include('Output after $match stage');
    });

    it('renders the info sprinkle', function() {
      expect(component.find('InfoSprinkle')).
        to.be.present();
      expect(component.find('InfoSprinkle').prop('helpLink')).
        to.include('/aggregation/match');
    });
  });

  context('does not break when the stage is invalid', function() {
    // While we constrain users to the stages in the dropdown
    // with 'Create pipeline from text' they are still able to import
    // pipelines with stages that are invalid. From analytics, it looks like
    // they actually do that sometimes. We want to make sure that when they do,
    // Compass does not completely break.


    let component;

    beforeEach(function() {
      component = shallow(
        <StagePreviewToolbar
          openLink={sinon.spy()}
          stageOperator="$monkey"
          isValid
          count={10}
          isEnabled />
      );
    });

    afterEach(function() {
      component = null;
    });

    it('renders the stage text', function() {
      expect(component.find(`.${styles['stage-preview-toolbar']}`)).
        to.include.text('(Sample of 10 documents)');
    });

    it('renders the stage link', function() {
      expect(component.find('.stage-preview-toolbar-link-invalid')).
        to.have.text('$monkey');
    });

    it('renders the info sprinkle', function() {
      expect(component.find('InfoSprinkle')).
        to.not.be.present();
    });
  });

  context('when the stage is not enabled', function() {
    let component;

    beforeEach(function() {
      component = shallow(
        <StagePreviewToolbar
          openLink={sinon.spy()}
          stageOperator="$match"
          isValid
          count={10}
          isEnabled={false} />
      );
    });

    afterEach(function() {
      component = null;
    });

    it('does not render the stage text', function() {
      expect(component.find(`.${styles['stage-preview-toolbar']}`)).
        to.have.text('Stage is disabled. Results not passed in the pipeline.');
    });
  });

  context('when the stage operator is $out', function() {
    context('when the value is a collection', function() {
      let component;

      beforeEach(function() {
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

      afterEach(function() {
        component = null;
      });

      it('renders the $out stage text', function() {
        expect(component.find(`.${styles['stage-preview-toolbar']}`)).
          to.have.text('Documents will be saved to the collection: collection');
      });
    });

    context('when the value is an invalid string while isValid is true', function() {
      let component;

      beforeEach(function() {
        component = shallow(
          <StagePreviewToolbar
            openLink={sinon.spy()}
            stageOperator="$out"
            stageValue="'''" // 3 single quotes.
            count={0}
            isValid
            isEnabled />
        );
      });

      afterEach(function() {
        component = null;
      });

      it('renders the $out stage text', function() {
        expect(component.find(`.${styles['stage-preview-toolbar']}`)).
          to.have.text('Unable to parse the destination for the out stage.');
      });
    });

    context('when the value is s3', function() {
      context('when the value is a string', function() {
        let component;

        beforeEach(function() {
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

        afterEach(function() {
          component = null;
        });

        it('renders the $out stage text', function() {
          expect(component.find(`.${styles['stage-preview-toolbar']}`)).
            to.have.text('Documents will be saved to S3.');
        });
      });

      context('when the value is an object', function() {
        let component;

        beforeEach(function() {
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

        afterEach(function() {
          component = null;
        });

        it('renders the $out stage text', function() {
          expect(component.find(`.${styles['stage-preview-toolbar']}`)).
            to.have.text('Documents will be saved to S3.');
        });
      });
    });

    context('when the value is atlas', function() {
      let component;

      beforeEach(function() {
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

      afterEach(function() {
        component = null;
      });

      it('renders the $out stage text', function() {
        expect(component.find(`.${styles['stage-preview-toolbar']}`)).
          to.have.text('Documents will be saved to Atlas cluster.');
      });
    });
  });

  context('when there is no stage operator', function() {
    let component;

    beforeEach(function() {
      component = shallow(
        <StagePreviewToolbar
          openLink={sinon.spy()}
          stageOperator={null}
          count={0}
          isValid
          isEnabled />
      );
    });

    afterEach(function() {
      component = null;
    });

    it('renders the stage text', function() {
      expect(component.find(`.${styles['stage-preview-toolbar']}`)).
        to.have.text('A sample of the aggregated results from this stage will be shown below');
    });
  });
});
