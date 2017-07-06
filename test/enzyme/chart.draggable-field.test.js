/* eslint no-unused-vars: 0 */
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const Dropdown = require('react-bootstrap').Dropdown;

const shallow = require('enzyme').shallow;

const DraggableField = require('../../src/internal-packages/chart/lib/components/draggable-field.jsx').DecoratedComponent;
const ArrayReductionPicker = require('../../src/internal-packages/chart/lib/components/array-reduction-picker');


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
      expect(component).to.have.text(fieldName);
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

  describe('when there are no reductions', () => {
    const fieldName = 'coordinates';
    const fieldPath = `location.${fieldName}`;

    before(() => {
      const identity = el => el;
      component = shallow(
        <DraggableField
          type="nominal"
          fieldName={fieldName}
          fieldPath={fieldPath}
          connectDragSource={identity}
          reductions={[]}
          enableMenus
          // onRemove is required only if enableMenus is set
          onRemove={identity}
        />
      );
    });
    it('should not render the array reduction picker', () => {
      // show no reduction by searching for it and showing a count
      expect(component.find(ArrayReductionPicker)).to.have.lengthOf(0);
    });
  });

  describe('when there is one reduction', () => {
    const fieldName = 'coordinates';
    const fieldPath = `location.${fieldName}`;
    const reductions = [
      {field: 'coordinates', type: 'unwind'}
    ];

    before(() => {
      const identity = el => el;
      component = shallow(
        <DraggableField
          type="nominal"
          fieldName={fieldName}
          fieldPath={fieldPath}
          connectDragSource={identity}
          reductions={reductions}
          enableMenus
          // onRemove is required only if enableMenus is set
          onRemove={identity}
        />
      );
    });

    it('should render one array reduction picker', () => {
      // show one reduction by searching for it and showing a count
      expect(component.find(ArrayReductionPicker)).to.have.lengthOf(reductions.length);
    });

    it('should have a tooltip for array reductions', () => {
      const titleArray = component.find('.chart-draggable-field-title-array');
      expect(titleArray.prop('data-tip')).to.match(/^In order to use fields or values/);
    });
  });

  describe('when there are multiple reductions', () => {
    const fieldName = 'coordinates';
    const fieldPath = `location.${fieldName}`;
    const reductions = [
      {field: 'coordinates', type: 'unwind'},
      {field: 'coordinates', type: null},
      {field: 'coordinates', type: null},
      {field: 'coordinates', type: null}
    ];

    before(() => {
      const identity = el => el;
      component = shallow(
        <DraggableField
          type="nominal"
          fieldName={fieldName}
          fieldPath={fieldPath}
          connectDragSource={identity}
          reductions={reductions}
          enableMenus
          // onRemove is required only if enableMenus is set
          onRemove={identity}
        />
      );
    });

    it('should render multiple array reduction pickers', () => {
      // show one reduction by searching for it and showing a count
      expect(component.find(ArrayReductionPicker)).to.have.lengthOf(reductions.length);
    });
  });
});
