import { expect } from 'chai';
import { getNextStep, getPreviousStep } from './utils';
import { MockDataGeneratorStep } from './types';

describe('Mock Data Generator Modal Utils', () => {
  describe('getNextStep', () => {
    it('should go from AI_DISCLAIMER to SCHEMA_CONFIRMATION', () => {
      expect(getNextStep(MockDataGeneratorStep.AI_DISCLAIMER)).to.equal(
        MockDataGeneratorStep.SCHEMA_CONFIRMATION
      );
    });

    it('should go from SCHEMA_CONFIRMATION to SCHEMA_EDITOR', () => {
      expect(getNextStep(MockDataGeneratorStep.SCHEMA_CONFIRMATION)).to.equal(
        MockDataGeneratorStep.SCHEMA_EDITOR
      );
    });

    it('should go from SCHEMA_EDITOR to DOCUMENT_COUNT', () => {
      expect(getNextStep(MockDataGeneratorStep.SCHEMA_EDITOR)).to.equal(
        MockDataGeneratorStep.DOCUMENT_COUNT
      );
    });

    it('should go from DOCUMENT_COUNT to PREVIEW_DATA', () => {
      expect(getNextStep(MockDataGeneratorStep.DOCUMENT_COUNT)).to.equal(
        MockDataGeneratorStep.PREVIEW_DATA
      );
    });

    it('should go from PREVIEW_DATA to GENERATE_DATA', () => {
      expect(getNextStep(MockDataGeneratorStep.PREVIEW_DATA)).to.equal(
        MockDataGeneratorStep.GENERATE_DATA
      );
    });

    it('should stay on GENERATE_DATA if already at GENERATE_DATA', () => {
      expect(getNextStep(MockDataGeneratorStep.GENERATE_DATA)).to.equal(
        MockDataGeneratorStep.GENERATE_DATA
      );
    });
  });

  describe('getPreviousStep', () => {
    it('should stay on AI_DISCLAIMER if already at AI_DISCLAIMER', () => {
      expect(getPreviousStep(MockDataGeneratorStep.AI_DISCLAIMER)).to.equal(
        MockDataGeneratorStep.AI_DISCLAIMER
      );
    });

    it('should go from SCHEMA_CONFIRMATION to AI_DISCLAIMER', () => {
      expect(
        getPreviousStep(MockDataGeneratorStep.SCHEMA_CONFIRMATION)
      ).to.equal(MockDataGeneratorStep.AI_DISCLAIMER);
    });

    it('should go from SCHEMA_EDITOR to SCHEMA_CONFIRMATION', () => {
      expect(getPreviousStep(MockDataGeneratorStep.SCHEMA_EDITOR)).to.equal(
        MockDataGeneratorStep.SCHEMA_CONFIRMATION
      );
    });

    it('should go from DOCUMENT_COUNT to SCHEMA_EDITOR', () => {
      expect(getPreviousStep(MockDataGeneratorStep.DOCUMENT_COUNT)).to.equal(
        MockDataGeneratorStep.SCHEMA_EDITOR
      );
    });

    it('should go from PREVIEW_DATA to DOCUMENT_COUNT', () => {
      expect(getPreviousStep(MockDataGeneratorStep.PREVIEW_DATA)).to.equal(
        MockDataGeneratorStep.DOCUMENT_COUNT
      );
    });

    it('should go from GENERATE_DATA to PREVIEW_DATA', () => {
      expect(getPreviousStep(MockDataGeneratorStep.GENERATE_DATA)).to.equal(
        MockDataGeneratorStep.PREVIEW_DATA
      );
    });
  });
});
