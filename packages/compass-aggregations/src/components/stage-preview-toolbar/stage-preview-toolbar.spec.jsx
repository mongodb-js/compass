import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import configureStore from '../../stores/store';
import StagePreviewToolbar from './stage-preview-toolbar';
import { changeStageDisabled } from '../../modules/pipeline-builder/stage-editor';

import styles from './stage-preview-toolbar.module.less';

function mountStagePreviewToolbar(
  options = {}
) {
  const store = configureStore({
    sourcePipeline: [{ $match: { _id: 1 } }],
    namespace: 'test.test',
    ...options
  });
  const wrapper = mount(
    <Provider store={store}>
      <StagePreviewToolbar index={0}></StagePreviewToolbar>
    </Provider>
  );
  wrapper.store = store;
  return wrapper;
}

describe('StagePreviewToolbar [Component]', function() {
  context('when the stage is enabled', function() {
    let component;

    beforeEach(function() {
      component = mountStagePreviewToolbar();
    });

    afterEach(function() {
      if (component) {
        component.unmount();
        component = null;
      }
    });

    it('renders the stage text', function() {
      expect(component.find(`.${styles['stage-preview-toolbar']}`)).
        to.include.text('(Sample of 0 documents)');
    });

    it('renders the stage text with the right link', function() {
      expect(component.text()).
        to.include('Output after $match stage');
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
      component = mountStagePreviewToolbar({
        sourcePipeline: [{ $monkey: 1 }]
      });
    });

    afterEach(function() {
      component.unmount();
      component = null;
    });

    it('renders the stage text', function() {
      expect(component.find(`.${styles['stage-preview-toolbar']}`)).
        to.include.text('(Sample of 0 documents)');
    });

    it('renders the stage link', function() {
      expect(component.find('a.stage-preview-toolbar-link')).
        to.have.text('$monkey');
    });
  });

  context('when the stage is not enabled', function() {
    let component;

    beforeEach(function() {
      component = mountStagePreviewToolbar();
      component.store.dispatch(changeStageDisabled(0, true));
    });

    afterEach(function() {
      component.unmount();
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
        component = mountStagePreviewToolbar({
          sourcePipeline: [{ $out: 'collection' }]
        });
      });

      afterEach(function() {
        component.unmount();
        component = null;
      });

      it('renders the $out stage text', function() {
        expect(component.find(`.${styles['stage-preview-toolbar']}`)).
          to.have.text('Documents will be saved to test.collection.');
      });
    });

    context('when the value is s3', function() {
      context('when the value is a string', function() {
        let component;

        beforeEach(function() {
          component = mountStagePreviewToolbar({
            sourcePipeline: [{ $out: { s3: 'test' } }]
          });
        });

        afterEach(function() {
          component.unmount();
          component = null;
        });

        it('renders the $out stage text', function() {
          expect(component.find(`.${styles['stage-preview-toolbar']}`)).
            to.have.text('Documents will be saved to S3 bucket.');
        });
      });

      context('when the value is an object', function() {
        let component;

        beforeEach(function() {
          component = mountStagePreviewToolbar({
            sourcePipeline: [{ $out: { s3: { bucket: 'test' } } }]
          });
        });

        afterEach(function() {
          component.unmount();
          component = null;
        });

        it('renders the $out stage text', function() {
          expect(component.find(`.${styles['stage-preview-toolbar']}`)).
            to.have.text('Documents will be saved to S3 bucket.');
        });
      });
    });

    context('when the value is atlas', function() {
      let component;

      beforeEach(function() {
        component = mountStagePreviewToolbar({
          sourcePipeline: [{ $out: { atlas: { projectId: 'test' } } }]
        });
      });

      afterEach(function() {
        component.unmount();
        component = null;
      });

      it('renders the $out stage text', function() {
        expect(component.find(`.${styles['stage-preview-toolbar']}`)).
          to.have.text('Documents will be saved to Atlas cluster.');
      });
    });
  });

  context('when the stage operator is $merge', function() {
    context('when the value is a collection', function() {
      let component;

      beforeEach(function() {
        component = mountStagePreviewToolbar({
          sourcePipeline: [{ $merge: { into: 'collection' } }]
        });
      });

      afterEach(function() {
        component.unmount();
        component = null;
      });

      it('renders the $merge stage text', function() {
        expect(component.find(`.${styles['stage-preview-toolbar']}`)).
          to.have.text('Documents will be saved to test.collection.');
      });
    });

    context('when the value is atlas', function() {
      let component;

      beforeEach(function() {
        component = mountStagePreviewToolbar({
          sourcePipeline: [
            { $merge: { into: { atlas: { projectId: 'test' } } } }
          ]
        });
      });

      afterEach(function() {
        component.unmount();
        component = null;
      });

      it('renders the $merge stage text', function() {
        expect(component.find(`.${styles['stage-preview-toolbar']}`)).
          to.have.text('Documents will be saved to Atlas cluster.');
      });
    });
  });

  context('when there is no stage operator', function() {
    let component;

    beforeEach(function() {
      component = mountStagePreviewToolbar({
        sourcePipeline: [{}]
      });
    });

    afterEach(function() {
      component.unmount();
      component = null;
    });

    it('renders the stage text', function() {
      expect(component.find(`.${styles['stage-preview-toolbar']}`)).
        to.have.text('A sample of the aggregated results from this stage will be shown below.');
    });
  });
});
