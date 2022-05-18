import React from 'react';

type QueryBarProps = {};

export const QueryBar: React.FunctionComponent<QueryBarProps> = ({}) => {
  return <div>QueryBar</div>;

  // return (
  //   <div className={_inputGroupClassName}>
  //     <div
  //       onBlur={this._onBlur}
  //       onFocus={this._onFocus}
  //       className={_queryOptionClassName}
  //     >
  //       {this.renderOptionRows()}
  //     </div>
  //     <div className={styles['button-group']}>
  //       {/* <button
  //         data-test-id="query-bar-apply-filter-button"
  //         key="apply-button"
  //         className={_applyButtonClassName}
  //         type="button"
  //         onClick={this.onApplyButtonClicked}
  //         disabled={applyDisabled}
  //       >
  //         {buttonLabel}
  //       </button> */}
  //       <Button
  //         data-test-id="query-bar-apply-filter-button"
  //         // key="apply-button"
  //         // className={_applyButtonClassName}
  //         // styles['apply-button']
  //         // type="button"
  //         onClick={this.onApplyButtonClicked}
  //         disabled={applyDisabled}
  //         variant="primary"
  //         size="small"
  //       >
  //         {buttonLabel}
  //       </Button>
  //       <Button
  //         aria-label="Reset query"
  //         data-test-id="query-bar-reset-filter-button"
  //         onClick={this.onResetButtonClicked}
  //         // styles['reset-button']
  //         disabled={queryState !== 'apply'}
  //         size="small"
  //       >
  //         Reset
  //       </Button>
  //       {/* <button
  //         data-test-id="query-bar-reset-filter-button"
  //         key="reset-button"
  //         className={_resetButtonClassName}
  //         type="button"
  //         onClick={this.onResetButtonClicked}
  //       >
  //         Reset
  //       </button> */}
  //       {showQueryHistoryButton && (
  //         <Button
  //           id="query_history_button"
  //           // key="query-history-button"
  //           // className={_queryHistoryClassName}
  //           // styles['query-history-button']
  //           data-test-id="query-history-button"
  //           onClick={this.props.actions.toggleQueryHistory}
  //           title="Toggle Query History"
  //           size="small"
  //         >
  //           <FontAwesome
  //             data-test-id="query-history-button-icon"
  //             name="history"
  //           />
  //         </Button>
  //       )}
  //     </div>

  //     {showExportToLanguageButton && (
  //       <Menu
  //         data-testid="connection-menu"
  //         align="bottom"
  //         justify="start"
  //         id="query-bar-menu-actions"
  //         trigger={
  //           <Button
  //             // className={cx(
  //             //   dropdownButtonStyles,
  //             //   css({
  //             //     color: iconColor,
  //             //   })
  //             // )}
  //             size="small"
  //             aria-label="Query Options Menu"
  //           >
  //             <Icon glyph="Ellipsis" />
  //           </Button>
  //         }
  //         open={this.state.menuIsOpen}
  //         setOpen={() =>
  //           this.setState({ menuIsOpen: !this.state.menuIsOpen })
  //         }
  //       >
  //         <MenuItem
  //           data-testid="export-to-language"
  //           onClick={this.props.actions.exportToLanguage}
  //         >
  //           Export To Language
  //         </MenuItem>
  //       </Menu>
  //     )}

  //     {/* {showExportToLanguageButton && (
  //       <Dropdown pullRight id="query-bar-menu-actions">
  //         <Dropdown.Toggle noCaret>
  //           <i className="mms-icon-ellipsis" aria-hidden />
  //         </Dropdown.Toggle>
  //         <Dropdown.Menu>
  //           <MenuItem onClick={this.props.actions.exportToLanguage}>
  //             Export To Language
  //           </MenuItem>
  //         </Dropdown.Menu>
  //       </Dropdown>
  //     )} */}
  //   </div>
  // );
};
