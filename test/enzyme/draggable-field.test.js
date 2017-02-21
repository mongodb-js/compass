/* eslint no-unused-vars: 0 */
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const Button = require('react-bootstrap').Button;
const Dropdown = require('react-bootstrap').Dropdown;

const shallow = require('enzyme').shallow;

const DraggableField = require('../../src/internal-packages/chart/lib/component/draggable-field.jsx');


chai.use(chaiEnzyme());

describe('<DraggableField />', () => {
  let component;


  describe('when menus are not enabled', () => {
    const name = 'address';
    beforeEach(function() {
      component = shallow(<DraggableField type="TEMPORAL" fieldName={name}/>);
    });

    it('should have 3 buttons', () => {
      expect(component.find(Button)).to.have.length(3);
    });

    it('the middle element should have the field name', () => {
      expect(component.find(Button).at(1).html()).to.contain(name);
    });
  });

  describe('when menus are enabled', () => {
    const name = 'coordinates';
    beforeEach(() => {
      component = shallow(<DraggableField type="TEMPORAL" fieldName={name} enableMenus/>);
    });

    it('should have 1 button', () => {
      expect(component.find(Button)).to.have.length(1);
    });

    it('should have 2 dropdown elements', () => {
      expect(component.find(Dropdown)).to.have.length(2);
    });

    it('the button should have the field name', () => {
      expect(component.find(Button).at(0).html()).to.contain(name);
    });
  });
});
