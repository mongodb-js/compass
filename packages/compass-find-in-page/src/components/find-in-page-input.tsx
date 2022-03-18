import React, { useCallback, useEffect, useRef } from 'react';
import { TextInput, IconButton, Icon, Body, withTheme, css, cx } from '@mongodb-js/compass-components';

import styles from './find-in-page-input.module.less';

const KEYCODE_ENTER = 13;
const KEYCODE_ESC = 27;

type FindInPageInputProps = {
  dispatchStopFind: () => void;
  setSearchTerm: (searchTerm: string) => void;
  dispatchFind: (searchTerm: string, isDirectionInversed: boolean, searching: boolean) => void;
  toggleStatus: () => void;
  searchTerm: string;
  searching: boolean;
};

function FindInPageInput({
  dispatchStopFind,
  setSearchTerm,
  dispatchFind,
  toggleStatus,
  searchTerm,
  searching,
}: FindInPageInputProps) {
  const findInPageInputRef = useRef<HTMLInputElement>(null);


    const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    }, [setSearchTerm]);

    const onClose = useCallback(() => {
      dispatchStopFind();
      setSearchTerm('');
      toggleStatus();
    }, [dispatchStopFind, setSearchTerm, toggleStatus]);


  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.keyCode === KEYCODE_ESC) {
      onClose();
    }

    if (e.keyCode === KEYCODE_ENTER) {
      e.preventDefault();
      // const val = document.querySelector('#find-in-page-input').value;
      const searchValue = findInPageInputRef.current.value;
      if (!searchValue || searchValue === '') return dispatchStopFind();

      const back = e.shiftKey;
      dispatchFind(searchValue, !back, searching);
    }
  }, [ onClose, dispatchFind, searching, dispatchStopFind ]);

  useEffect(() => {
    findInPageInputRef.current?.focus();
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [ onKeyDown ]);

  // componentDidMount() {
  //   // const el = document.querySelector('#find-in-page-input');
  //   // if (el) el.focus();
  //   window.addEventListener('keydown', this.onKeyDown);
  // }

  // componentWillUnmount() {
  //   window.removeEventListener('keydown', this.onKeyDown);
  // }

  // onKeyDown = e => {
  //   if (e.keyCode === KEYCODE_ESC) {
  //     this.handleClose();
  //   }

  //   if (e.keyCode === KEYCODE_ENTER) {
  //     e.preventDefault();
  //     const val = document.querySelector('#find-in-page-input').value;
  //     if (!val || val === '') return this.props.dispatchStopFind();

  //     const back = e.shiftKey;
  //     this.props.dispatchFind(val, !back, this.props.searching);
  //   }
  // };

    return (
      <div className={styles.wrapper}>
        <Body
          className={styles['wrapper-span']}
        >
          Use (Shift+) Enter to navigate results.
        </Body>
        <div className={styles.find}>
          <form
            name="find-in-page"
            data-test-id="find-in-page"
            className={styles['find-in-page']}
          >
            <TextInput
              type="search"
              aria-label="Find in page"
              ref={findInPageInputRef}
              id="find-in-page-input"
              onChange={onSearchChange}
              value={searchTerm}
            />
          </form>
          <IconButton
            className={styles['find-close']}
            aria-label="Close find box"
            onClick={onClose}
          >
            <Icon
              glyph="X"
              role="presentation"
            />
          </IconButton>
        </div>
      </div>
    );
}

export default withTheme(FindInPageInput);
