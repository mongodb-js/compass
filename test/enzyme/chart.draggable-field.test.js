/* eslint no-unused-vars: 0 */
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const Dropdown = require('react-bootstrap').Dropdown;

const shallow = require('enzyme').shallow;

const DraggableField = require('../../src/internal-packages/chart/lib/components/draggable-field.jsx').DecoratedComponent;


chai.use(chaiEnzyme());

describe('<DraggableField />', () => {
  let component;

  describe('when menus are not enabled', () => {
    const fieldName = 'address';
    beforeEach(function() {
      const identity = el => el;
      component = shallow(
        <DraggableField
          type="temporal"
          fieldName={fieldName}
          fieldPath={fieldName}
          connectDragSource={identity}
          isDragging={false} />
      );
    });

    it('should have no dropdown menus', () => {
      expect(component.find(Dropdown)).to.have.length(0);
    });

    it('the middle element should have the field name', () => {
      expect(component.children().at(1).html()).to.contain(fieldName);
    });
  });

  describe('when menus are enabled', () => {
    const fieldName = 'coordinates';
    beforeEach(() => {
      const identity = el => el;
      component = shallow(
        <DraggableField
          type="temporal"
          fieldName={fieldName}
          fieldPath={fieldName}
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
      expect(component.children().at(1).html()).to.contain(fieldName);
    });
  });

  describe('when menus are enabled and the fieldPath is nested', () => {
    const fieldName = 'coordinates';
    const fieldPath = `location.${fieldName}`;
    beforeEach(() => {
      const identity = el => el;
      component = shallow(
        <DraggableField
          type="temporal"
          fieldName={fieldName}
          fieldPath={fieldPath}
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
      expect(component.children().at(1).html()).to.contain(fieldName);
    });

    it('the field path is the title', () => {
      expect(component.props()).to.have.property('title', fieldPath);
    });
  });
});
