import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import { StagePreview } from './stage-preview';
import styles from './stage-preview.module.less';
import loadingStyles from '../loading-overlay/loading-overlay.module.less';

describe('StagePreview [Component]', function() {
  context('when the stage operator is not $out', function() {
    let component;

    beforeEach(function() {
      component = mount(
        <StagePreview
          documents={[{ name: 'test' }]}
          isValid
          isEnabled
          isComplete
          index={0}
          onRunOutStageClick={sinon.spy()}
          onGoToOutResultsClick={sinon.spy()}
          onGoToMergeResultsClick={sinon.spy()}
          isLoading={false} />
      );
    });

    afterEach(function() {
      component = null;
    });

    it('renders the wrapper div', function() {
      expect(component.find(`.${styles['stage-preview']}`)).to.be.present();
    });

    it('renders the documents', function() {
      expect(component.find(`.${styles['stage-preview-documents']}`)).to.be.present();
    });
  });

  context('when there are no documents', function() {
    let component;

    beforeEach(function() {
      component = mount(
        <StagePreview
          documents={[]}
          isValid
          isEnabled
          isComplete
          index={0}
          onRunOutStageClick={sinon.spy()}
          onGoToOutResultsClick={sinon.spy()}
          onGoToMergeResultsClick={sinon.spy()}
          isLoading={false} />
      );
    });

    afterEach(function() {
      component = null;
    });

    it('renders an empty state', function() {
      expect(
        component.find(`.${styles['stage-preview-empty']}`)
      ).to.be.present();
    });
  });


  context('when the stage operator is $out', function() {
    context('when the execution is not complete', function() {
      let component;

      beforeEach(function() {
        component = mount(
          <StagePreview
            documents={[{ name: 'test' }]}
            isValid
            isEnabled
            isComplete={false}
            index={0}
            onRunOutStageClick={sinon.spy()}
            onGoToOutResultsClick={sinon.spy()}
            onGoToMergeResultsClick={sinon.spy()}
            isLoading={false}
            stageValue=""
            stageOperator="$out" />
        );
      });

      afterEach(function() {
        component = null;
      });

      it('renders the wrapper div', function() {
        expect(component.find(`.${styles['stage-preview']}`)).to.be.present();
      });

      it('does not render the documents', function() {
        expect(component.find(`.${styles['stage-preview-documents']}`)).to.not.be.present();
      });

      it('renders the out text', function() {
        expect(component.find(`.${styles['stage-preview-out-text']}`)).to.be.present();
      });
    });

    context('when the execution is complete', function() {
      let component;
      const gotoSpy = sinon.spy();

      beforeEach(function() {
        component = mount(
          <StagePreview
            stageValue="'testing'"
            documents={[{ name: 'test' }]}
            isValid
            isEnabled
            isComplete
            index={0}
            onRunOutStageClick={sinon.spy()}
            onGoToOutResultsClick={gotoSpy}
            onGoToMergeResultsClick={sinon.spy()}
            isLoading={false}
            stageOperator="$out" />
        );
      });

      afterEach(function() {
        component = null;
      });

      it('renders the wrapper div', function() {
        expect(component.find(`.${styles['stage-preview']}`)).to.be.present();
      });

      it('does not render the documents', function() {
        expect(component.find(`.${styles['stage-preview-documents']}`)).to.not.be.present();
      });

      it('renders the out text', function() {
        expect(component.find(`.${styles['stage-preview-out-text']}`)).to.be.present();
      });

      it('renders the link', function() {
        expect(component.find(`.${styles['stage-preview-out-link']}`)).to.be.present();
      });
    });
  });

  context('when the preview is loading', function() {
    context('when the stage operator is $out', function() {
      let component;

      beforeEach(function() {
        component = mount(
          <StagePreview
            documents={[]}
            isValid
            isEnabled
            isLoading
            index={0}
            isComplete={false}
            onRunOutStageClick={sinon.spy()}
            onGoToOutResultsClick={sinon.spy()}
            onGoToMergeResultsClick={sinon.spy()}
            stageValue=""
            stageOperator="$out" />
        );
      });

      afterEach(function() {
        component = null;
      });

      it('renders the loading overlay', function() {
        expect(component.find(`.${loadingStyles['loading-overlay-box-text']}`)).
          to.have.text('Persisting Documents...');
      });
    });

    context('when the stage operator is not $out', function() {
      let component;

      beforeEach(function() {
        component = mount(
          <StagePreview
            documents={[]}
            isValid
            isEnabled
            isLoading
            isComplete={false}
            index={0}
            onRunOutStageClick={sinon.spy()}
            onGoToOutResultsClick={sinon.spy()}
            onGoToMergeResultsClick={sinon.spy()}
            stageOperator="$match" />
        );
      });

      afterEach(function() {
        component = null;
      });

      it('renders the loading overlay', function() {
        expect(component.find(`.${loadingStyles['loading-overlay-box-text']}`)).
          to.have.text('Loading Preview Documents...');
      });

      it('does not show the empty state', function() {
        expect(
          component.find(`.${styles['stage-preview-empty']}`)
        ).to.not.be.present();
      });
    });
  });


  context('when atlas deployed', function () {
    let component;

    function render(stageOperator = '$out') {
      return mount(
        <StagePreview
          documents={[{ name: 'test' }]}
          isValid
          isEnabled
          isComplete={false}
          index={0}
          onRunOutStageClick={sinon.spy()}
          onGoToOutResultsClick={sinon.spy()}
          onGoToMergeResultsClick={sinon.spy()}
          isLoading={false}
          stageValue=""
          stageOperator={stageOperator}
          isAtlasDeployed
        />
      );
    }

    afterEach(function () {
      component.unmount();
      component = null;
    });

    it('shows "Save documents" button for $out stage', function () {
      component = render('$out');
      expect(
        component
          .getDOMNode()
          .querySelector('[data-testid="save-out-documents"]')
      ).to.exist;
    });

    it('shows "Merge documents" button for $merge stage', function () {
      component = render('$merge');
      expect(
        component
          .getDOMNode()
          .querySelector('[data-testid="save-merge-documents"]')
      ).to.exist;
    });
  });
});
