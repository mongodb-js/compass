import React from 'react';
import { expect } from 'chai';
import { render, screen } from '@mongodb-js/testing-library-compass';
import {
  AnalysisProgressStatus,
  type AnalysisProgressStatusProps,
} from './analysis-progress-status';
import Sinon from 'sinon';

describe('AnalysisProgressStatus', () => {
  const renderAnalysisProgressStatus = (
    options: Partial<AnalysisProgressStatusProps>
  ) => {
    const props: AnalysisProgressStatusProps = {
      step: 'IDLE',
      sampledCollections: 0,
      analyzedCollections: 0,
      collectionRelationsInferred: 0,
      totalCollections: 0,
      onCancelClick: () => {},
      ...options,
    };
    return render(<AnalysisProgressStatus {...props} />);
  };

  it('Allows cancellation', () => {
    const onCancel = Sinon.spy();
    renderAnalysisProgressStatus({
      step: 'SAMPLING',
      sampledCollections: 2,
      totalCollections: 5,
      onCancelClick: onCancel,
    });
    expect(screen.getByText('Cancel')).to.be.visible;
    screen.getByText('Cancel').click();
    expect(onCancel).to.have.been.calledOnce;
  });

  describe('Keeps showing progress along the way', () => {
    it('Sampling', () => {
      renderAnalysisProgressStatus({
        step: 'SAMPLING',
        sampledCollections: 2,
        totalCollections: 5,
      });
      expect(screen.getByText('Sampling collections..')).to.be.visible;
      expect(screen.getByText('2/5')).to.be.visible;
    });

    it('Analyzing', () => {
      renderAnalysisProgressStatus({
        step: 'ANALYZING_SCHEMA',
        analyzedCollections: 1,
        totalCollections: 5,
      });
      expect(screen.getByText('Analyzing collection schemas..')).to.be.visible;
      expect(screen.getByText('1/5')).to.be.visible;
    });

    it('Relations Inferring', () => {
      renderAnalysisProgressStatus({
        step: 'INFERRING_RELATIONSHIPS',
        collectionRelationsInferred: 3,
        totalCollections: 5,
      });
      expect(screen.getByText('Inferring relationships between collections..'))
        .to.be.visible;
      expect(screen.queryByText('3/5')).not.exist;
    });
  });
});
