const React = require('react');
const chaiEnzyme = require('chai-enzyme');
const sinon = require('sinon');
const chai = require('chai');
const { expect } = require('chai');
const { shallow, mount } = require('enzyme');
const { SortableTable } = require('../');

chai.use(chaiEnzyme());

describe('<SortableTable />', () => {
  context('when rendering without props', () => {
    const component = shallow(<SortableTable columns={[]}/>);

    it('has a `table` element with className of `sortable-table-table`', () => {
      expect(component.find('table')).to.have.className('sortable-table-table');
    });

    it('has a `thead` element', () => {
      expect(component.find('thead')).to.exist;
    });

    it('has a `thead tr` element with className `sortable-table-thead-tr`', () => {
      expect(component.find('thead tr')).to.have.className('sortable-table-thead-tr');
    });

    it('has a `tbody` element', () => {
      expect(component.find('tbody')).to.exist;
    });

    it('does not have any rows', () => {
      expect(component.find('tbody tr')).to.not.exist;
    });
  });

  context('when rendering with data as array of objects', () => {
    const columns = ['foo', 'bar', 'baz'];
    const rows = [
      {foo: 1, bar: 'string', baz: 'B'},
      {foo: 2, bar: 'another string', baz: 'A'}
    ];
    const component = shallow(<SortableTable columns={columns} rows={rows} />);

    it('has 2 rows', () => {
      expect(component.find('tbody tr')).to.have.lengthOf(2);
    });

    it('has 3 columns', () => {
      expect(component.find('thead th')).to.have.lengthOf(3);
    });

    it('has `another string` in the second row, second column', () => {
      expect(component.find('tbody tr td').at(4)).to.contain.text('another string');
    });
  });

  context('when making the rows removable', () => {
    const columns = ['foo', 'bar', 'baz'];
    const rows = [
      {foo: 1, bar: 'string', baz: 'B'},
      {foo: 2, bar: 'another string', baz: 'A'}
    ];
    const component = shallow(<SortableTable columns={columns} rows={rows} removable />);

    it('has 2 rows', () => {
      expect(component.find('tbody tr')).to.have.lengthOf(2);
    });

    it('has an extra column for delete button', () => {
      expect(component.find('thead th')).to.have.lengthOf(4);
    });

    it('has a button with className `sortable-table-trash-button` for each row', () => {
      expect(component.find('.sortable-table-trash-button')).to.have.lengthOf(2);
    });

    it('has a a trash icon with className `sortable-table-trash-icon` in the button', () => {
      expect(component.find('.sortable-table-trash-button').first().childAt(0))
        .to.have.className('sortable-table-trash-icon');
    });

    it('calls the `onRowDeleteButtonClicked` callback when clicking on the delete button', () => {
      const deleteSpy = sinon.spy();
      const mountedComponent = mount(
        <SortableTable
          columns={columns}
          rows={rows}
          removable
          onRowDeleteButtonClicked={deleteSpy}/>
      );
      mountedComponent.find('.sortable-table-trash-button').first().simulate('click');
      expect(deleteSpy.called).to.be.true;
      expect(deleteSpy.calledWith(0)).to.be.true;
    });
  });

  context('when making the rows sortable', () => {
    const columns = ['foo', 'bar', 'baz'];
    const rows = [
      {foo: 1, bar: 'string', baz: 'B'},
      {foo: 2, bar: 'another string', baz: 'A'}
    ];
    const component = shallow(
      <SortableTable
        columns={columns}
        rows={rows}
        sortable />
    );

    it('has 2 rows', () => {
      expect(component.find('tbody tr')).to.have.lengthOf(2);
    });

    it('has a sort icon in the first column by default', () => {
      expect(component.find('thead th').first()).to.have.descendants('.sortable-table-sort-icon');
    });

    it('has the `-is-active` modifier on the first header column by default', () => {
      expect(component.find('thead th').first()).to.include.className('sortable-table-th-is-active');
    });

    it('has only one `-is-active` modifier on header columns', () => {
      expect(component.find('.sortable-table-th-is-active')).to.have.lengthOf(1);
    });

    it('keeps the sort order when clicking on another column header', () => {
      const sortSpy = sinon.spy();
      const mountedComponent = mount(
        <SortableTable
          columns={columns}
          rows={rows}
          sortable
          sortColumn="bar"
          sortOrder="desc"
          onColumnHeaderClicked={sortSpy}
        />);
      mountedComponent.find('th').first().simulate('click');
      expect(sortSpy.called).to.be.true;
      expect(sortSpy.firstCall.calledWith('foo', 'desc')).to.be.true;
    });

    it('switches the sort order when clicking on the same column header', () => {
      const sortSpy = sinon.spy();
      const mountedComponent = mount(
        <SortableTable
          columns={columns}
          rows={rows}
          sortable
          sortColumn="foo"
          sortOrder="desc"
          onColumnHeaderClicked={sortSpy}
        />);
      mountedComponent.find('th').first().simulate('click');
      expect(sortSpy.called).to.be.true;
      expect(sortSpy.firstCall.calledWith('foo', 'asc')).to.be.true;
    });
  });

  context('when hovering over a row', () => {
    it('calls the onBodyRowMouseEnter prop', () => {
      const expectedIndex = 0;
      const columns = ['foo'];
      const rows = [
        {foo: 1}
      ];
      const hoverSpy = sinon.spy();
      const mountedComponent = mount(
        <SortableTable
          columns={columns}
          rows={rows}
          onBodyRowMouseEnter={hoverSpy}
        />);
      mountedComponent.find('tr').last().simulate('mouseEnter');
      expect(hoverSpy.getCall(0).args[0]).to.be.equal(expectedIndex);
      expect(hoverSpy.getCall(0).args[1].type).to.be.equal('mouseenter');
    });
  });

  context('when leaving a hovered row', () => {
    it('calls the onBodyRowMouseLeave prop', () => {
      const expectedIndex = 0;
      const columns = ['foo'];
      const rows = [
        {foo: 1}
      ];
      const hoverSpy = sinon.spy();
      const mountedComponent = mount(
        <SortableTable
          columns={columns}
          rows={rows}
          onBodyRowMouseLeave={hoverSpy}
        />);
      mountedComponent.find('tr').last().simulate('mouseLeave');
      expect(hoverSpy.getCall(0).args[0]).to.be.equal(expectedIndex);
      expect(hoverSpy.getCall(0).args[1].type).to.be.equal('mouseleave');
    });
  });
});
