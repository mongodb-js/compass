/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const sinon = require('sinon');
const { mount } = require('enzyme');
const AppRegistry = require('hadron-app-registry');

// use chai-enzyme assertions, see https://github.com/producthunt/chai-enzyme
chai.use(chaiEnzyme());


describe('<FieldPanel />', function() {
  beforeEach(function() {
    // Mock the AppRegistry with a new one so tests don't complain about
    // appRegistry.getComponent (i.e. appRegistry being undefined)
    app.appRegistry = new AppRegistry();


    this.FieldPanel = require('../../src/internal-packages/chart/lib/components/field-panel');
    this.FieldPanelItem = require('../../src/internal-packages/chart/lib/components/field-panel-item');
  });

  const fieldTemplate = {
    '_id': {
      'name': '_id',
      'path': '_id',
      'count': 4,
      'type': 'ObjectID',
      'probability': 1
    }
  };

  it('renders the initial state', function() {
    const component = mount(<this.FieldPanel />);
    expect(component.find(this.FieldPanelItem)).to.not.exist;
  });

  it('renders a flat structure', function() {
    const fields = Object.assign({}, fieldTemplate, {
      'foo': {
        'name': 'foo',
        'path': 'foo',
        'count': 4,
        'type': 'String',
        'probability': 1
      },
      'bar': {
        'name': 'bar',
        'path': 'bar',
        'count': 1,
        'type': 'String',
        'probability': 0.25
      }
    });
    const component = mount(<this.FieldPanel fieldsCache={fields} rootFields={Object.keys(fields)}/>);
    expect(component.find(this.FieldPanelItem)).to.exist;
    expect(component.find(this.FieldPanelItem)).to.have.lengthOf(3);
    expect(component.find(this.FieldPanelItem).at(0)).to.have.text('_id');
    expect(component.find(this.FieldPanelItem).at(1)).to.have.text('foo');
    expect(component.find(this.FieldPanelItem).at(2)).to.have.text('bar');
  });

  it('renders with a field group', function() {
    const fields = Object.assign({}, fieldTemplate, {
      'foo': {
        'name': 'foo',
        'path': 'foo',
        'count': 4,
        'type': 'Document',
        'probability': 1,
        'nestedFields': ['foo.bar']
      },
      'foo.bar': {
        'name': 'bar',
        'path': 'foo.bar',
        'count': 4,
        'type': 'String',
        'probability': 1
      }
    });
    const component = mount(<this.FieldPanel fieldsCache={fields} rootFields={Object.keys(fields)}/>);
    expect(component.find(this.FieldPanelItem)).to.exist;
    expect(component.find(this.FieldPanelItem)).to.have.lengthOf(4);
    expect(component.find(this.FieldPanelItem).at(0)).to.have.text('_id');
    expect(component.find('.chart-builder-field-group-label')).to.have.text('foo');
    expect(component.find(this.FieldPanelItem).at(2)).to.have.text('bar');
  });

  it('renders with multiple field groups and fields', function() {
    const fields = Object.assign({}, fieldTemplate, {
      'foo': {
        'name': 'foo',
        'path': 'foo',
        'count': 4,
        'type': 'Document',
        'probability': 1,
        'nestedFields': ['foo.bar']
      },
      'foo.bar': {
        'name': 'bar',
        'path': 'foo.bar',
        'count': 4,
        'type': 'String',
        'probability': 1
      },
      'fizz': {
        'name': 'fizz',
        'path': 'fizz',
        'count': 4,
        'type': 'Document',
        'probability': 1,
        'nestedFields': ['fizz.bang']
      },
      'fizz.bang': {
        'name': 'bang',
        'path': 'fizz.bang',
        'count': 4,
        'type': 'String',
        'probability': 1
      }
    });
    const component = mount(<this.FieldPanel fieldsCache={fields} rootFields={Object.keys(fields)}/>);
    expect(component.find(this.FieldPanelItem)).to.exist;
    expect(component.find(this.FieldPanelItem)).to.have.lengthOf(7);
    expect(component.find(this.FieldPanelItem).at(0)).to.have.text('_id');
    expect(component.find('.chart-builder-field-group-label').at(0)).to.have.text('foo');
    expect(component.find(this.FieldPanelItem).at(2)).to.have.text('bar');
    expect(component.find(this.FieldPanelItem).at(3)).to.have.text('bar');
    expect(component.find('.chart-builder-field-group-label').at(1)).to.have.text('fizz');
    expect(component.find(this.FieldPanelItem).at(5)).to.have.text('bang');
    expect(component.find(this.FieldPanelItem).at(6)).to.have.text('bang');
  });
});
