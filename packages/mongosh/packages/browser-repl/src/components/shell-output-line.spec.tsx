import React from 'react';
import { expect } from '../../testing/chai';
import { shallow, mount } from '../../testing/enzyme';

import { ShellOutputLine } from './shell-output-line';
import { HelpOutput } from './types/help-output';
import { CursorOutput } from './types/cursor-output';
import { CursorIterationResultOutput } from './types/cursor-iteration-result-output';
import { SimpleTypeOutput } from './types/simple-type-output';
import { ObjectOutput } from './types/object-output';
import { ErrorOutput } from './types/error-output';

describe('<ShellOutputLine />', () => {
  it('renders a string value', () => {
    const wrapper = shallow(<ShellOutputLine entry={{ format: 'output', value: 'some text' }} />);
    expect(wrapper.find(SimpleTypeOutput)).to.have.lengthOf(1);
  });

  it('renders an integer value', () => {
    const wrapper = shallow(<ShellOutputLine entry={{ format: 'output', value: 1 }} />);
    expect(wrapper.find(SimpleTypeOutput)).to.have.lengthOf(1);
  });

  it('renders an object', () => {
    const object = { x: 1 };
    const wrapper = shallow(<ShellOutputLine entry={{ format: 'output', value: object }} />);
    expect(wrapper.find(ObjectOutput)).to.have.lengthOf(1);
  });

  it('renders undefined', () => {
    const wrapper = shallow(<ShellOutputLine entry={{ format: 'output', value: undefined }} />);
    expect(wrapper.find(SimpleTypeOutput)).to.have.lengthOf(1);
  });

  it('renders null', () => {
    const wrapper = shallow(<ShellOutputLine entry={{ format: 'output', value: null }} />);
    expect(wrapper.find(SimpleTypeOutput)).to.have.lengthOf(1);
  });

  it('renders function', () => {
    const wrapper = shallow(<ShellOutputLine entry={{ format: 'output', value: (x): any => x }} />);
    expect(wrapper.find(SimpleTypeOutput)).to.have.lengthOf(1);
  });

  it('renders class', () => {
    const wrapper = shallow(<ShellOutputLine entry={{ format: 'output', value: class C {} }} />);
    expect(wrapper.find(SimpleTypeOutput)).to.have.lengthOf(1);
  });

  it('renders Help', () => {
    const wrapper = shallow(<ShellOutputLine entry={{
      format: 'output',
      type: 'Help',
      value: {
        help: 'Help',
        docs: '#',
        attr: []
      } }
    } />);

    expect(wrapper.find(HelpOutput)).to.have.lengthOf(1);
  });

  it('renders Cursor', () => {
    const wrapper = shallow(<ShellOutputLine entry={{
      format: 'output',
      type: 'Cursor',
      value: []
    }} />);

    expect(wrapper.find(CursorOutput)).to.have.lengthOf(1);
  });

  it('renders CursorIterationResult', () => {
    const wrapper = shallow(<ShellOutputLine entry={{
      format: 'output',
      type: 'CursorIterationResult',
      value: []
    }} />);

    expect(wrapper.find(CursorIterationResultOutput)).to.have.lengthOf(1);
  });

  it('renders Database', () => {
    const wrapper = mount(<ShellOutputLine entry={{
      format: 'output',
      type: 'Database',
      value: 'value string'
    }} />);

    expect(wrapper.text()).to.contain('value string');
  });

  it('renders Collection', () => {
    const wrapper = mount(<ShellOutputLine entry={{
      format: 'output',
      type: 'Collection',
      value: 'value string'
    }} />);

    expect(wrapper.text()).to.contain('value string');
  });

  it('renders ShowCollectionsResult', () => {
    const wrapper = mount(<ShellOutputLine entry={{
      format: 'output',
      type: 'ShowCollectionsResult',
      value: 'value string'
    }} />);

    expect(wrapper.text()).to.contain('value string');
  });

  it('renders ShowDatabasesResult', () => {
    const wrapper = mount(<ShellOutputLine entry={{
      format: 'output',
      type: 'ShowDatabasesResult',
      value: [
        { name: 'admin', sizeOnDisk: 45056, empty: false },
        { name: 'dxl', sizeOnDisk: 8192, empty: false },
        { name: 'supplies', sizeOnDisk: 2236416, empty: false },
        { name: 'test', sizeOnDisk: 5664768, empty: false },
        { name: 'test', sizeOnDisk: 599999768000, empty: false }
      ]
    }} />);

    expect(wrapper.text()).to.contain('admin     45.1 kB\ndxl       8.19 kB\nsupplies  2.24 MB\ntest      5.66 MB\ntest       600 GB');
  });

  it('renders ShowCollectionsResult', () => {
    const wrapper = mount(<ShellOutputLine entry={{
      format: 'output',
      type: 'ShowCollectionsResult',
      value: [
        'nested_documents', 'decimal128', 'coll', 'people_imported', 'cats'
      ]
    }} />);

    expect(wrapper.text()).to.contain('nested_documents\ndecimal128\ncoll\npeople_imported\ncats');
  });

  it('renders StatsResult', () => {
    const wrapper = mount(<ShellOutputLine entry={{
      format: 'output',
      type: 'StatsResult',
      value: {
        c1: { metadata: 1 },
        c2: { metadata: 2 }
      }
    }} />);

    expect(wrapper.find('hr')).to.have.lengthOf(1);
    expect(wrapper.text()).to.include('metadata');
  });

  it('renders ListCommandsResult', () => {
    const wrapper = mount(<ShellOutputLine entry={{
      format: 'output',
      type: 'ListCommandsResult',
      value: {
        c1: { metadata: 1, help: 'help string' },
      }
    }}/>);

    expect(wrapper.text()).to.include('help string');
    expect(wrapper.text()).to.include('c1');
    expect(wrapper.text()).to.include('metadata');
  });

  it('renders ShowProfileResult with count = 0', () => {
    const wrapper = mount(<ShellOutputLine entry={{
      format: 'output',
      type: 'ShowProfileResult',
      value: {
        count: 0
      }
    }}/>);
    expect(wrapper.text()).to.include('db.system.profile is empty');
  });

  it('renders ShowProfileResult with count > 0', () => {
    const wrapper = mount(<ShellOutputLine entry={{
      format: 'output',
      type: 'ShowProfileResult',
      value: {
        count: 1,
        result: [
          {
            op: 'command',
            ns: 'test.system.profile',
            command: {
              aggregate: 'system.profile',
              pipeline: [
                { '$match': {} },
                { '$group': { _id: 1, n: { '$sum': 1 } } }
              ],
              cursor: {},
              lsid: { id: 'bin' },
              '$db': 'test'
            },
            keysExamined: 0,
            docsExamined: 6,
            cursorExhausted: true,
            numYield: 0,
            nreturned: 1,
            locks: {
              ReplicationStateTransition: { acquireCount: { w: 2 } },
              Global: { acquireCount: { r: 2 } },
              Database: { acquireCount: { r: 2 } },
              Collection: { acquireCount: { r: 2 } },
              Mutex: { acquireCount: { r: 2 } }
            },
            flowControl: {},
            responseLength: 132,
            protocol: 'op_msg',
            millis: 1,
            planSummary: 'COLLSCAN',
            ts: 'ts',
            client: '127.0.0.1',
            appName: 'mongosh 0.2.2',
            allUsers: [],
            user: ''
          }
        ]
      }
    }}/>);
    expect(wrapper.text()).to.contain('command    test.system.profile 1ms ts');
    expect(wrapper.text()).to.contain('aggregate');
  });

  it('renders an error', () => {
    const err = new Error('x');
    const wrapper = shallow(<ShellOutputLine entry={{ format: 'output', value: err }} />);
    expect(wrapper.find(ErrorOutput)).to.have.lengthOf(1);
  });

  it('renders an input line', () => {
    const wrapper = mount(<ShellOutputLine entry={{ format: 'input', value: 'some text' }} />);
    expect(wrapper.text()).to.contain('some text');
  });
});

