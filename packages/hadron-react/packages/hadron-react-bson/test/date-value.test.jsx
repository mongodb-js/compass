const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { DateValue } = require('../');

describe('<DateValue />', () => {
  const date = new Date('2016-01-01 12:00:00');
  const component = shallow(<DateValue type="Date" value={date} />);

  it('sets the base class', () => {
    expect(component.hasClass('element-value')).to.equal(true);
  });

  it('sets the type class', () => {
    expect(component.hasClass('element-value-is-date')).to.equal(true);
  });

  it('sets the title', () => {
    expect(component.props().title).to.contain('2016-01-01');
  });

  it('sets the value', () => {
    expect(component.text()).to.contain('2016-01-01');
  });
});

describe('<DateValue />', () => {
  describe('without a timezone', function() {
    const date = new Date('2016-01-01 12:00:00');
    const component = shallow(<DateValue type="Date" value={date} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-date')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.contain('2016-01-01');
    });

    it('sets the date value', () => {
      expect(component.text()).to.contain('2016-01-01');
    });

    it('sets the time value', () => {
      expect(component.text()).to.contain('12:00:00');
    });
  });

  describe('with a timezone', function() {
    const date = new Date(1451667600000);
    const component = shallow(<DateValue type="Date" value={date} tz={'America/Los_Angeles'} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-date')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.contain('2016-01-01');
    });

    it('sets the date value', () => {
      expect(component.text()).to.contain('2016-01-01');
    });

    it('sets the time value', () => {
      expect(component.text()).to.contain('09:00:00');
    });
  });
});
