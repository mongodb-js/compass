import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SimpleTypeOutput } from './simple-type-output';
import { inspect } from '../utils/inspect';

interface ShowProfileResult {
  count: number;
  result?: any[];
}

interface ShowProfileOutputProps {
  value: ShowProfileResult;
}

export class ShowProfileOutput extends Component<ShowProfileOutputProps> {
  static propTypes = {
    value: PropTypes.object
  };

  render(): JSX.Element {
    if (this.props.value.count === 0) {
      return <SimpleTypeOutput value='db.system.profile is empty.\nUse db.setProfilingLevel(2) will enable profiling.\nUse db.getCollection("system.profile").find() to show raw profile entries.'/>;
    }
    // direct from old shell
    const toret = (this.props.value.result as any).map((x: any) => {
      const res = `${x.op}    ${x.ns} ${x.millis}ms ${String(x.ts).substring(0, 24)}\n`;
      let l = '';
      for (const z in x) {
        if (z === 'op' || z === 'ns' || z === 'millis' || z === 'ts') {
          continue;
        }

        const val = x[z];
        const mytype = typeof (val);

        if (mytype === 'object') {
          l += z + ':' + inspect(val) + ' ';
        } else if (mytype === 'boolean') {
          l += z + ' ';
        } else {
          l += z + ':' + val + ' ';
        }
      }
      return `${res}${l}`;
    });
    return <SimpleTypeOutput value={toret}/>;
  }
}
