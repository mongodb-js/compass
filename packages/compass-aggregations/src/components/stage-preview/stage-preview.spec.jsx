import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import StagePreview from '../stage-preview';
import styles from './stage-preview.module.less';
import loadingStyles from '../loading-overlay/loading-overlay.module.less';

describe('StagePreview [Component]', function() {
  context('when the stage operator is not $out', function() {
    let component;

    beforeEach(function() {
      component = mount(
        <StagePreview
          openLink={sinon.spy()}
          documents={[{ name: 'test' }]}
          isValid
          isEnabled
          isComplete
          index={0}
          runOutStage={sinon.spy()}
          gotoOutResults={sinon.spy()}
          gotoMergeResults={sinon.spy()}
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
          openLink={sinon.spy()}
          documents={[]}
          isValid
          isEnabled
          isComplete
          index={0}
          runOutStage={sinon.spy()}
          gotoOutResults={sinon.spy()}
          gotoMergeResults={sinon.spy()}
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
            openLink={sinon.spy()}
            documents={[{ name: 'test' }]}
            isValid
            isEnabled
            isComplete={false}
            index={0}
            runOutStage={sinon.spy()}
            gotoOutResults={sinon.spy()}
            gotoMergeResults={sinon.spy()}
            isLoading={false}
            stage=""
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
            openLink={sinon.spy()}
            stage="'testing'"
            documents={[{ name: 'test' }]}
            isValid
            isEnabled
            isComplete
            index={0}
            runOutStage={sinon.spy()}
            gotoOutResults={gotoSpy}
            gotoMergeResults={sinon.spy()}
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

      context('when clicking on the link', function() {
        it('correctly decomments the collection name', function() {
          component.find(`button`).simulate('click');
          expect(gotoSpy.calledWith('testing')).to.equal(true);
        });
      });
    });
  });

  context('when the preview is loading', function() {
    context('when the stage operator is $out', function() {
      let component;

      beforeEach(function() {
        component = mount(
          <StagePreview
            openLink={sinon.spy()}
            documents={[]}
            isValid
            isEnabled
            isLoading
            index={0}
            isComplete={false}
            runOutStage={sinon.spy()}
            gotoOutResults={sinon.spy()}
            gotoMergeResults={sinon.spy()}
            stage=""
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
            openLink={sinon.spy()}
            documents={[]}
            isValid
            isEnabled
            isLoading
            isComplete={false}
            index={0}
            runOutStage={sinon.spy()}
            gotoOutResults={sinon.spy()}
            gotoMergeResults={sinon.spy()}
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
});
