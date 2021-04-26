/* eslint-disable complexity */
import React, { Component } from 'react';
import classnames from 'classnames';

import PropTypes from 'prop-types';
import Icon from '@leafygreen-ui/icon';

import { LineWithIcon } from './utils/line-with-icon';

import { HelpOutput } from './types/help-output';
import { ShowDbsOutput } from './types/show-dbs-output';
import { ShowCollectionsOutput } from './types/show-collections-output';
import { CursorOutput } from './types/cursor-output';
import { CursorIterationResultOutput } from './types/cursor-iteration-result-output';
import { ObjectOutput } from './types/object-output';
import { StatsResultOutput } from './types/stats-result-output';
import { SimpleTypeOutput } from './types/simple-type-output';
import { ErrorOutput } from './types/error-output';
import { ShowProfileOutput } from './types/show-profile-output';

const styles = require('./shell-output-line.less');

type ShellOutputEntryValue = any;
type Glyph = 'ChevronRight' | 'XWithCircle' | 'ChevronLeft';


export interface ShellOutputEntry {
  format: 'input' | 'output' | 'error';
  type?: string | null;
  value: ShellOutputEntryValue;
}

interface ShellOutputLineProps {
  entry: ShellOutputEntry;
}

export class ShellOutputLine extends Component<ShellOutputLineProps> {
  static propTypes = {
    entry: PropTypes.object.isRequired
  };

  private renderValue(): JSX.Element {
    const { type, value, format } = this.props.entry;

    if (format === 'input' ||
      this.isPreformattedResult(value, type)) {
      return <pre>{value}</pre>;
    }

    if (typeof value === 'string' && type !== null) {
      return <SimpleTypeOutput value={value} raw />;
    }

    if (this.isPrimitiveOrFunction(value)) {
      return <SimpleTypeOutput value={value} />;
    }

    if (type === 'Help') {
      return <HelpOutput value={value} />;
    }

    if (type === 'ShowDatabasesResult') {
      return <ShowDbsOutput value={value} />;
    }

    if (type === 'StatsResult') {
      return <StatsResultOutput value={value} />;
    }

    if (type === 'ListCommandsResult)') {
      return <SimpleTypeOutput value={value} />;
    }

    if (type === 'ShowCollectionsResult') {
      return <ShowCollectionsOutput value={value} />;
    }

    if (type === 'Cursor' || type === 'AggregationCursor') {
      return <CursorOutput value={value} />;
    }

    if (type === 'CursorIterationResult') {
      return <CursorIterationResultOutput value={value} />;
    }

    if (type === 'ShowProfileResult') {
      return <ShowProfileOutput value={value} />;
    }

    if (this.isError(value)) {
      return <ErrorOutput value={value} />;
    }

    return <ObjectOutput value={value} />;
  }

  private isError(value: any): boolean {
    return typeof value.message === 'string' && typeof value.stack === 'string';
  }

  private isPreformattedResult(value: any, type?: string | null): boolean {
    return typeof value === 'string' &&
    type === 'Database' ||
    type === 'Collection';
  }

  private isPrimitiveOrFunction(value: any): boolean {
    // any primitive type including 'null' and 'undefined',
    // function and classes
    return value !== Object(value) ||
      typeof value === 'function';
  }

  private getIconGlyph(): Glyph {
    const { format } = this.props.entry;

    if (format === 'input') {
      return 'ChevronRight';
    }

    if (format === 'error') {
      return 'XWithCircle';
    }

    return 'ChevronLeft';
  }

  render(): JSX.Element {
    const { format } = this.props.entry;

    const className = classnames(
      styles['shell-output-line'],
      styles[`shell-output-line-${format}`]
    );

    const icon = (<Icon
      size={12}
      glyph={this.getIconGlyph()}
      className={styles['shell-output-line-icon']}
    />);

    return <LineWithIcon className={className} icon={icon}>{this.renderValue()}</LineWithIcon>;
  }
}

