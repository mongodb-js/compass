import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import { CompassExperimentationProvider } from './experimentation-provider';
import { ExperimentTestGroup, ExperimentTestName } from './growth-experiments';

import { AtlasSkillsBanner } from './atlas-skills-banner';

describe('AtlasSkillsBanner Component', function () {
  const defaultProps = {
    ctaText:
      'New to MongoDB? Document modeling skills will accelerate your progress.',
    skillsUrl: 'https://www.mongodb.com/skills',
    onCloseSkillsBanner: sinon.spy(),
    showBanner: true,
  };

  // Helper function to render component with experimentation provider
  const renderWithExperimentationProvider = (props = defaultProps) => {
    return render(
      <CompassExperimentationProvider
        useAssignment={() => ({
          assignment: {
            assignmentData: {
              variant: ExperimentTestGroup.atlasSkillsVariant,
              isInSample: true,
            },
            experimentData: {
              assignmentDate: new Date().toISOString(),
              entityId: 'mock-entity-id',
              entityType: 'USER',
              id: 'mock-assignment-id',
              name: ExperimentTestName.atlasSkills,
              variant: ExperimentTestGroup.atlasSkillsVariant,
              isInSample: true,
              assignmentId: 'mock-assignment-id',
              experimentId: 'mock-experiment-id',
              experimentName: ExperimentTestName.atlasSkills,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
            experimentName: ExperimentTestName.atlasSkills,
            assignmentId: 'mock-assignment-id',
          },
          asyncStatus: null,
          error: null,
          isLoading: false,
          isError: false,
          isSuccess: true,
        })}
        assignExperiment={() => Promise.resolve(null)}
        getAssignment={() => Promise.resolve(null)}
      >
        <AtlasSkillsBanner {...props} />
      </CompassExperimentationProvider>
    );
  };

  it('should render the banner with CTA text and badge icon', function () {
    renderWithExperimentationProvider();

    expect(
      screen.getByText(
        'New to MongoDB? Document modeling skills will accelerate your progress.'
      )
    ).to.be.visible;

    // Badge component renders with the custom SVG icon
    const svgIcon = screen.getByRole('img', { hidden: true });
    expect(svgIcon).to.exist;
  });

  it('should render the "Go to Skills" button with correct link and OpenNewTab icon', function () {
    renderWithExperimentationProvider();

    const goToSkillsButton = screen.getByRole('link', {
      name: /go to skills/i,
    });
    expect(goToSkillsButton).to.be.visible;
    expect(goToSkillsButton.getAttribute('href')).to.equal(
      'https://www.mongodb.com/skills'
    );
    expect(goToSkillsButton.getAttribute('target')).to.equal('_blank');
    // Verify the button has an icon by checking for svg element
    expect(goToSkillsButton.querySelector('svg')).to.exist;
  });

  it('should render the close button and call onCloseSkillsBanner when clicked', function () {
    const onCloseSkillsBanner = sinon.spy();
    renderWithExperimentationProvider({
      ...defaultProps,
      onCloseSkillsBanner,
    });

    const closeButton = screen.getByRole('button', {
      name: 'Close Atlas Skills CTA',
    });
    expect(closeButton).to.be.visible;
    expect(closeButton.getAttribute('title')).to.equal(
      'Close Atlas Skills CTA'
    );

    userEvent.click(closeButton);
    expect(onCloseSkillsBanner).to.have.been.calledOnce;
  });

  it('should not render when showBanner is false', function () {
    renderWithExperimentationProvider({
      ...defaultProps,
      showBanner: false,
    });

    // Banner should not be visible
    expect(
      screen.queryByText(
        'New to MongoDB? Document modeling skills will accelerate your progress.'
      )
    ).to.not.exist;
    expect(screen.queryByRole('img', { hidden: true })).to.not.exist;
    expect(screen.queryByRole('link', { name: /go to skills/i })).to.not.exist;
  });

  it('should not render when user is not in experiment variant', function () {
    render(
      <CompassExperimentationProvider
        useAssignment={() => ({
          assignment: {
            assignmentData: {
              variant: ExperimentTestGroup.atlasSkillsControl, // Control group
              isInSample: true,
            },
            experimentData: {
              assignmentDate: new Date().toISOString(),
              entityId: 'mock-entity-id',
              entityType: 'USER',
              id: 'mock-assignment-id',
              name: ExperimentTestName.atlasSkills,
              variant: ExperimentTestGroup.atlasSkillsControl,
              isInSample: true,
              assignmentId: 'mock-assignment-id',
              experimentId: 'mock-experiment-id',
              experimentName: ExperimentTestName.atlasSkills,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
            experimentName: ExperimentTestName.atlasSkills,
            assignmentId: 'mock-assignment-id',
          },
          asyncStatus: null,
          error: null,
          isLoading: false,
          isError: false,
          isSuccess: true,
        })}
        assignExperiment={() => Promise.resolve(null)}
        getAssignment={() => Promise.resolve(null)}
      >
        <AtlasSkillsBanner {...defaultProps} />
      </CompassExperimentationProvider>
    );

    // Banner should not be visible when in control group
    expect(
      screen.queryByText(
        'New to MongoDB? Document modeling skills will accelerate your progress.'
      )
    ).to.not.exist;
    expect(screen.queryByRole('img', { hidden: true })).to.not.exist;
    expect(screen.queryByRole('link', { name: /go to skills/i })).to.not.exist;
  });

  it('should not render when experiment assignment is null', function () {
    render(
      <CompassExperimentationProvider
        useAssignment={() => ({
          assignment: null, // No experiment assignment
          asyncStatus: null,
          error: null,
          isLoading: false,
          isError: false,
          isSuccess: true,
        })}
        assignExperiment={() => Promise.resolve(null)}
        getAssignment={() => Promise.resolve(null)}
      >
        <AtlasSkillsBanner {...defaultProps} />
      </CompassExperimentationProvider>
    );

    // Banner should not be visible when no assignment
    expect(
      screen.queryByText(
        'New to MongoDB? Document modeling skills will accelerate your progress.'
      )
    ).to.not.exist;
    expect(screen.queryByRole('img', { hidden: true })).to.not.exist;
    expect(screen.queryByRole('link', { name: /go to skills/i })).to.not.exist;
  });
});
