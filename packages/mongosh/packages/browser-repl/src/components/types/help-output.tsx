import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import i18n from '@mongosh/i18n';

const styles = require('./help-output.less');

type HelpApiObject = {
  help: string;
  docs: string;
  attr: HelpApiObjectAttr[];
};

type HelpApiObjectAttr = {
  name: string;
  description: string;
};

interface HelpOutputProps {
  value: HelpApiObject;
}

export class HelpOutput extends Component<HelpOutputProps> {
  static propTypes = {
    value: PropTypes.object.isRequired
  };

  renderAttrTable = (attr: HelpApiObjectAttr[]): JSX.Element | undefined => {
    if (!attr || !attr.length) { return; }

    return (<table>
      <tbody>{attr.map(this.renderAttrTableRow)}</tbody>
    </table>);
  };

  renderAttrTableRow = (attr: HelpApiObjectAttr, i: number): JSX.Element => {
    return (<tr key={`row-${i}`}>
      <th>{attr.name}</th>
      <td>{attr.description}</td>
    </tr>);
  };

  renderHelpDocsLink(docs: string): JSX.Element | undefined {
    if (!docs) { return; }

    return (<div>
      {i18n.__('cli-repl.args.moreInformation')} <a href={docs} target="_blank">{docs}</a>
    </div>);
  }

  renderHelpText(helpText: string): JSX.Element | undefined {
    if (!helpText) { return; }

    return (<div>{helpText}</div>);
  }

  render(): JSX.Element {
    const help = this.props.value;

    const className = classnames(styles['help-output']);
    return (
      <div className={className}>
        {this.renderHelpText(help.help)}
        {this.renderAttrTable(help.attr)}
        {this.renderHelpDocsLink(help.docs)}
      </div>
    );
  }
}
