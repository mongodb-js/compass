import React, { Component } from 'react';
import classnames from 'classnames';

import Icon from '@leafygreen-ui/icon';

import { LineWithIcon } from './line-with-icon';

const styles = require('./expandable.less');

type ExpandableProps = {};

interface ExpandableState {
  expanded: boolean;
}

/**
 * A container that can be expanded or collapsed.
 *
 * Keeps track of the collapsed state and passes it down
 * to children.
 *
 * @example Usage - with render prop
 *
 * <Expandable>{
 *  (expanded) => <span>Parent expanded = {JSON.stringify(expanded)}</span>
 * }</Expandable>
 *
 */
export class Expandable extends Component<ExpandableProps, ExpandableState> {
  static propTypes = {};

  state: Readonly<ExpandableState> = {
    expanded: false
  };

  toggle = (): void => {
    this.setState({ expanded: !this.state.expanded });
  };

  render(): JSX.Element {
    const icon = (<Icon
      size={12}
      glyph={this.state.expanded ? 'CaretDown' : 'CaretRight'}
      className={classnames(styles['expandable-caret'])}
      onClick={this.toggle}
    />);

    return (<LineWithIcon icon={icon}>
      {typeof this.props.children === 'function'
        ? this.props.children(this.state.expanded, this.toggle)
        : this.props.children}

    </LineWithIcon>);
  }
}
