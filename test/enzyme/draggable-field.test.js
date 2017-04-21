/* eslint no-unused-vars: 0 */
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const Button = require('react-bootstrap').Button;
const Dropdown = require('react-bootstrap').Dropdown;

const shallow = require('enzyme').shallow;

const DraggableField = require('../../src/internal-packages/chart/lib/components/draggable-field.jsx').DecoratedComponent;


chai.use(chaiEnzyme());

describe('<DraggableField />', () => {
  let component;


  describe('when menus are not enabled', () => {
    const name = 'address';
    beforeEach(function() {
      const identity = function(el) { return el; };
      component = shallow(
        <DraggableField
          type="temporal"
          fieldName={name}
          connectDragSource={identity}
          isDragging={false} />
      );
    });

    it('should have no dropdown menus', () => {
      expect(component.find(Dropdown)).to.have.length(0);
    });

    it('the middle element should have the field name', () => {
      expect(component.children().at(1).html()).to.contain(name);
    });
  });

  describe('when menus are enabled', () => {
    const name = 'coordinates';
    beforeEach(() => {
      const identity = function(el) { return el; };
      component = shallow(
        <DraggableField
          type="temporal"
          fieldName={name}
          connectDragSource={identity}
          enableMenus
          // onRemove is required only if enableMenus is set
          onRemove={identity}
        />
      );
    });

    it('should have 2 dropdown menus', () => {
      expect(component.find(Dropdown)).to.have.length(2);
    });

    it('the middle element should have the field name', () => {
      expect(component.children().at(1).html()).to.contain(name);
    });
  });
});
