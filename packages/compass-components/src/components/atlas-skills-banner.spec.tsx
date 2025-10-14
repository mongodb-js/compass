import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

import { AtlasSkillsBanner } from './atlas-skills-banner';

describe('AtlasSkillsBanner Component', function () {
  const defaultProps = {
    ctaText:
      'New to MongoDB? Document modeling skills will accelerate your progress.',
    skillsUrl: 'https://www.mongodb.com/skills',
    onCloseSkillsBanner: sinon.spy(),
    showBanner: true,
  };

  it('should render the banner with correct text', function () {
    render(<AtlasSkillsBanner {...defaultProps} />);

    expect(
      screen.getByText(
        'New to MongoDB? Document modeling skills will accelerate your progress.'
      )
    ).to.be.visible;
  });

  it('should render the badge with award icon', function () {
    render(<AtlasSkillsBanner {...defaultProps} />);

    // Check for the award icon
    const awardIcon = screen.getByLabelText('Award Icon');
    expect(awardIcon).to.be.visible;
  });

  it('should render the "Go to Skills" button with correct href', function () {
    render(<AtlasSkillsBanner {...defaultProps} />);

    const goToSkillsButton = screen.getByRole('link', {
      name: /go to skills/i,
    });
    expect(goToSkillsButton).to.be.visible;
    expect(goToSkillsButton.getAttribute('href')).to.equal(
      'https://www.mongodb.com/skills'
    );
    expect(goToSkillsButton.getAttribute('target')).to.equal('_blank');
  });

  it('should call onCtaClick when "Go to Skills" button is clicked', function () {
    const onCtaClick = sinon.spy();
    render(<AtlasSkillsBanner {...defaultProps} onCtaClick={onCtaClick} />);

    const goToSkillsButton = screen.getByRole('link', {
      name: /go to skills/i,
    });

    userEvent.click(goToSkillsButton);
    expect(onCtaClick).to.have.been.calledOnce;
  });

  it('should render the close button and call onCloseSkillsBanner when clicked', function () {
    const onCloseSkillsBanner = sinon.spy();
    render(
      <AtlasSkillsBanner
        {...defaultProps}
        onCloseSkillsBanner={onCloseSkillsBanner}
      />
    );

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
    render(<AtlasSkillsBanner {...defaultProps} showBanner={false} />);

    // Banner should not be visible
    expect(
      screen.queryByText(
        'New to MongoDB? Document modeling skills will accelerate your progress.'
      )
    ).to.not.exist;
    expect(screen.queryByLabelText('Award Icon')).to.not.exist;
    expect(screen.queryByRole('link', { name: /go to skills/i })).to.not.exist;
  });
});
