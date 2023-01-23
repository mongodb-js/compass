import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import { FocusModePreview, InputPreview, OutputPreview } from './focus-mode-stage-preview';

describe('FocusModeStagePreview', function () {
  it('renders stage input', function () {
    render(<InputPreview />);
    const preview = screen.getByTestId('focus-mode-stage-preview');
    expect(preview).to.exist;
    expect(within(preview).getByText(/stage input/i)).to.exist;
  });

  it('renders stage output', function () {
    render(<OutputPreview />);
    const preview = screen.getByTestId('focus-mode-stage-preview');
    expect(preview).to.exist;
    expect(within(preview).getByText(/stage output/i)).to.exist;
  });

  context('FocusModePreview', function() {
    it('renders loader', function () {
      render(<FocusModePreview
        title=''
        isLoading={true}
        documents={[]} />
      );
      const preview = screen.getByTestId('focus-mode-stage-preview');
      expect(preview).to.exist;
      expect(within(preview).getByTitle(/loading/i)).to.exist;
    });
    it('renders list of documents', function () {
      render(<FocusModePreview
        title=''
        isLoading={false}
        documents={[{_id: 12345}, {_id: 54321}]} />
      );
      const preview = screen.getByTestId('focus-mode-stage-preview');
      expect(within(preview).getByText(/12345/i)).to.exist;
      expect(within(preview).getByText(/54321/i)).to.exist;
    });
    it('renders no preview documents when its not loading and documents are empty', function () {
      render(<FocusModePreview
        title=''
        isLoading={false}
        documents={[]} />
      );
      const preview = screen.getByTestId('focus-mode-stage-preview');
      expect(within(preview).getByText(/no preview documents/i)).to.exist;
    });
  });
});