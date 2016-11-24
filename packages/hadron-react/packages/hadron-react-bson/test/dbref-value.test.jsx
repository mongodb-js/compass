const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { DBRef, ObjectId } = require('bson');
const { DBRefValue} = require('../');

describe('<DBRefValue />', () => {
  const oid = ObjectId.createFromHexString('583711146b59b28fcfa66587');
  const value = new DBRef('coll', oid, 'db');
  const component = shallow(<DBRefValue type="DBRef" value={value} />);

  it('sets the base class', () => {
    expect(component.hasClass('element-value')).to.equal(true);
  });

  it('sets the type class', () => {
    expect(component.hasClass('element-value-is-dbref')).to.equal(true);
  });

  it('sets the title', () => {
    expect(component.props().title).to.equal('DBRef(coll, 583711146b59b28fcfa66587, db)');
  });

  it('sets the value', () => {
    expect(component.text()).to.equal('DBRef(coll, 583711146b59b28fcfa66587, db)');
  });
});
