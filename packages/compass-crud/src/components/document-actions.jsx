import React from 'react';
import PropTypes from 'prop-types';
// import { IconButton } from 'hadron-react-buttons';
import IconButton, { Size as IconButtonSizes } from '@leafygreen-ui/icon-button';
import Icon from '@leafygreen-ui/icon';

import UpdatableIconButton from './updatable-icon-button';

/**
 * Component for actions on the document.
 */
class DocumentActions extends React.Component {
  /**
   * Instantiate the actions.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
  }

  /**
   * Render the expand all button.
   *
   * @returns {React.Component} The expand all button.
   */
  renderExpandAll() {
    const title = this.props.allExpanded ? 'Collapse All' : 'Expand All';
    // const iconClass = this.props.allExpanded ? 'fa-angle-down' : 'fa-angle-right';
    return (
      <div className="document-actions-left">
        <IconButton
          aria-label={title}
          // className="document-actions-button btn btn-default btn-xs"
          // iconClassName="document-actions-button-icon fa fa-pencil"
          dataTestId="expand-all-button"
          onClick={this.props.expandAll}
          // IconButtonSizes={IconButtonSizes.}
        >
          <Icon
            glyph={this.props.allExpanded ? 'ChevronDown' : 'ChevronRight'}
            // size={IconButtonSizes.Default}
            title={title}
          />
        </IconButton>
        {/* <UpdatableIconButton
          title={title}
          clickHandler={this.props.expandAll}
          className="document-actions-button document-actions-expand-button btn btn-default btn-xs"
          iconClassName={`document-actions-button-icon fa ${iconClass}`}
          dataTestId="expand-all-button" /> */}
      </div>
    );
  }

  /**
   * Render the actions.
   *
   * @returns {Component} The actions component.
   */
  render() {
    return (
      <div className="document-actions">
        {this.props.expandAll && this.renderExpandAll()}
        <div className="document-actions-right">
          {/* {this.props.edit && <IconButton
            title="Edit Document"
            className="document-actions-button btn btn-default btn-xs"
            iconClassName="document-actions-button-icon fa fa-pencil"
            dataTestId="edit-document-button"
            clickHandler={this.props.edit}
          />}
          {this.props.copy && <IconButton
            title="Copy Document"
            className="document-actions-button document-actions-button-copy btn btn-default btn-xs"
            iconClassName="document-actions-button-icon fa fa-copy"
            dataTestId="copy-document-button"
            clickHandler={this.props.copy}
          />}
          {this.props.clone && <IconButton
            title="Clone Document"
            className="document-actions-button btn btn-default btn-xs"
            iconClassName="document-actions-button-icon fa fa-clone"
            dataTestId="clone-document-button"
            clickHandler={this.props.clone}
          />}
          {this.props.remove && <IconButton
            title="Delete Document"
            className="document-actions-button btn btn-default btn-xs"
            iconClassName="document-actions-button-icon fa fa-trash-o"
            dataTestId="delete-document-button"
            clickHandler={this.props.remove}
          />} */}
          {this.props.edit && <IconButton
            aria-label="Edit Document"
            // className="document-actions-button btn btn-default btn-xs"
            // iconClassName="document-actions-button-icon fa fa-pencil"
            dataTestId="edit-document-button"
            onClick={this.props.edit}
            // IconButtonSizes={IconButtonSizes.}
          >
            <Icon
              glyph="Edit"
              title="Edit Document"
              // size={IconButtonSizes.Default}
            />
          </IconButton>}
          {this.props.copy && <IconButton
            aria-label="Copy Document"
            // className="document-actions-button document-actions-button-copy btn btn-default btn-xs"
            // iconClassName="document-actions-button-icon fa fa-copy"
            dataTestId="copy-document-button"
            onClick={this.props.copy}
          >
            <Icon
              glyph="Copy"
              title="Copy Document"
              // size={IconButtonSizes.Default}
            />
          </IconButton>}
          {this.props.clone && <IconButton
            aria-label="Clone Document"
            // className="document-actions-button btn btn-default btn-xs"
            // iconClassName="document-actions-button-icon fa fa-clone"
            dataTestId="clone-document-button"
            onClick={this.props.clone}
          >
            {/* <Icon
              glyph=""
              size={Sizes}
            /> */}
            <i
              // className="document-actions-button-icon fa fa-clone"
              className="fa fa-clone"
              aria-hidden
            />
          </IconButton>}
          {this.props.remove && <IconButton
            aria-label="Delete Document"
            // className="document-actions-button btn btn-default btn-xs"
            // iconClassName="document-actions-button-icon fa fa-trash-o"
            dataTestId="delete-document-button"
            onClick={this.props.remove}
          >
            <Icon
              glyph="Trash"
              title="Delete Document"
              // size={Sizes}
            />
          </IconButton>}
        </div>
      </div>
    );
  }
}

DocumentActions.displayName = 'DocumentActions';

DocumentActions.propTypes = {
  edit: PropTypes.func.isRequired,
  remove: PropTypes.func.isRequired,
  clone: PropTypes.func.isRequired,
  allExpanded: PropTypes.bool,
  expandAll: PropTypes.func
};

export default DocumentActions;
