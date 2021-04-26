import React from 'react';
import { expect } from '../../../testing/chai';
import { shallow, ShallowWrapper } from '../../../testing/enzyme';

import { HelpOutput } from './help-output';

describe('HelpOutput', () => {
  const makeWrapper = (value): ShallowWrapper => {
    return shallow(<HelpOutput value={{
      help: value.help,
      docs: value.docs,
      attr: value.attr
    }} />);
  };

  it('renders the help text', () => {
    const wrapper = makeWrapper({
      help: 'some text'
    });
    expect(wrapper.text()).to.contain('some text');
  });

  it('renders the docs link', () => {
    const wrapper = makeWrapper({
      help: 'some text',
      docs: 'https://docs.example.com'
    });

    const anchor = wrapper.find('a');
    expect(anchor).to.have.lengthOf(1);
    expect(anchor.prop('href')).to.equal('https://docs.example.com');
  });

  it('does not render the docs link if none passed', () => {
    const wrapper = makeWrapper({
      help: 'some text'
    });

    const anchor = wrapper.find('a');
    expect(anchor).to.have.lengthOf(0);
  });

  it('renders the attrs table', () => {
    const wrapper = makeWrapper({
      help: 'some text',
      attr: [
        {
          name: 'command name',
          description: 'command description'
        }
      ]
    });

    expect(wrapper.text()).to.contain('command name');
    expect(wrapper.text()).to.contain('command description');
  });

  it('does not render the attrs table if none passed', () => {
    const wrapper = makeWrapper({
      help: 'some text'
    });

    const anchor = wrapper.find('table');
    expect(anchor).to.have.lengthOf(0);
  });
});
