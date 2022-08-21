import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { clone, isArray, isNull, isString, isUndefined } from 'lodash';
import { Description, Label } from '@leafygreen-ui/typography';
import Popover from '@leafygreen-ui/popover';
import {
  useDynamicRefs,
  useEventListener,
  useIdAllocator,
  usePrevious,
  useViewportSize,
} from '@leafygreen-ui/hooks';
import InteractionRing from '@leafygreen-ui/interaction-ring';
import Icon from '@leafygreen-ui/icon';
import IconButton from '@leafygreen-ui/icon-button';
import { cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';
import { isComponentType } from '@leafygreen-ui/lib';
import type {
  ComboboxProps,
  onChangeType,
  SelectValueType,
} from './combobox-types';
import { getNullSelection } from './combobox-types';
import { ComboboxContext } from './combobox-context';
import { InternalComboboxOption } from './combobox-option';
import { Chip } from './chip';
import {
  clearButton,
  comboboxParentStyle,
  comboboxStyle,
  endIcon,
  errorMessageStyle,
  inputElementStyle,
  inputWrapperStyle,
  interactionRingColor,
  interactionRingStyle,
  loadingIconStyle,
  menuList,
  menuMessage,
  menuStyle,
  menuWrapperStyle,
  popoverStyle,
} from './combobox.styles';
import { InternalComboboxGroup } from './combobox-group';
import type { OptionObject } from './util';
import { flattenChildren, getNameAndValue, keyMap } from './util';

/**
 * Component
 */
export default function Combobox<M extends boolean>({
  children,
  label,
  description,
  placeholder = 'Select',
  'aria-label': ariaLabel,
  disabled = false,
  size = 'default',
  darkMode = false,
  state = 'none',
  errorMessage,
  searchState = 'unset',
  searchEmptyMessage = 'No results found',
  searchErrorMessage = 'Could not get results!',
  searchLoadingMessage = 'Loading results...',
  filteredOptions,
  onFilter,
  clearable = true,
  onClear,
  overflow = 'expand-y',
  multiselect = false as M,
  initialValue,
  onChange,
  value,
  chipTruncationLocation,
  chipCharacterLimit = 12,
  className,
  ...rest
}: ComboboxProps<M>) {
  const getOptionRef = useDynamicRefs<HTMLLIElement>({ prefix: 'option' });
  const getChipRef = useDynamicRefs<HTMLSpanElement>({ prefix: 'chip' });

  const inputId = useIdAllocator({ prefix: 'combobox-input' });
  const labelId = useIdAllocator({ prefix: 'combobox-label' });
  const menuId = useIdAllocator({ prefix: 'combobox-menu' });

  const comboboxRef = useRef<HTMLDivElement>(null);
  const clearButtonRef = useRef<HTMLButtonElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isOpen, setOpen] = useState(false);
  const prevOpenState = usePrevious(isOpen);
  const [focusedOption, setFocusedOption] = useState<string | null>(null);
  const [selection, setSelection] = useState<SelectValueType<M> | null>(null);
  const prevSelection = usePrevious(selection);
  const [inputValue, setInputValue] = useState<string>('');
  const prevValue = usePrevious(inputValue);
  const [focusedChip, setFocusedChip] = useState<string | null>(null);

  const doesSelectionExist =
    !isNull(selection) &&
    ((isArray(selection) && selection.length > 0) || isString(selection));

  // Tells typescript that selection is multiselect
  const isMultiselect = useCallback(
    <T extends number | string>(test: Array<T> | T | null): test is Array<T> =>
      multiselect && isArray(test),
    [multiselect]
  );

  // Force focus of input box
  const setInputFocus = useCallback(
    (cursorPos?: number) => {
      if (!disabled && inputRef && inputRef.current) {
        inputRef.current.focus();
        if (!isUndefined(cursorPos)) {
          inputRef.current.setSelectionRange(cursorPos, cursorPos);
        }
      }
    },
    [disabled]
  );

  // Update selection differently in mulit & single select
  const updateSelection = useCallback(
    (value: string | null) => {
      if (isMultiselect(selection)) {
        const newSelection: SelectValueType<M> = clone(selection);

        if (isNull(value)) {
          newSelection.length = 0;
        } else {
          if (selection.includes(value)) {
            // remove from array
            newSelection.splice(newSelection.indexOf(value), 1);
          } else {
            // add to array
            newSelection.push(value);
            // clear text
            setInputValue('');
          }
        }
        setSelection(newSelection);
        (onChange as onChangeType<true>)?.(newSelection);
      } else {
        const newSelection: SelectValueType<M> = value as SelectValueType<M>;
        setSelection(newSelection);
        (onChange as onChangeType<false>)?.(
          newSelection as SelectValueType<false>
        );
      }
    },
    [isMultiselect, onChange, selection]
  );

  // Scrolls the combobox to the far right
  // Used when `overflow == 'scroll-x'`
  const scrollToEnd = () => {
    if (inputWrapperRef && inputWrapperRef.current) {
      // TODO - consider converting to .scrollTo(). This is not yet wuppoted in IE or jsdom
      inputWrapperRef.current.scrollLeft = inputWrapperRef.current.scrollWidth;
    }
  };

  const placeholderValue =
    multiselect && isArray(selection) && selection.length > 0
      ? undefined
      : placeholder;

  const allOptions = useMemo(() => flattenChildren(children), [children]);

  const getDisplayNameForValue = useCallback(
    (value: string | null): string => {
      return value
        ? allOptions.find((opt) => opt.value === value)?.displayName ?? value
        : '';
    },
    [allOptions]
  );

  // Computes whether the option is visible based on the current input
  const isOptionVisible = useCallback(
    (option: string | OptionObject): boolean => {
      const value = typeof option === 'string' ? option : option.value;

      // If filtered options are provided
      if (filteredOptions && filteredOptions.length > 0) {
        return filteredOptions.includes(value);
      }

      // otherwise, we do our own filtering
      const displayName =
        typeof option === 'string'
          ? getDisplayNameForValue(value)
          : option.displayName;
      return displayName.toLowerCase().includes(inputValue.toLowerCase());
    },
    [filteredOptions, getDisplayNameForValue, inputValue]
  );

  const visibleOptions = useMemo(
    () => allOptions.filter(isOptionVisible),
    [allOptions, isOptionVisible]
  );

  const isValueValid = useCallback(
    (value: string | null): boolean => {
      return value ? !!allOptions.find((opt) => opt.value === value) : false;
    },
    [allOptions]
  );

  const getIndexOfValue = useCallback(
    (value: string | null): number => {
      return visibleOptions
        ? visibleOptions.findIndex((option) => option.value === value)
        : -1;
    },
    [visibleOptions]
  );

  const getValueAtIndex = useCallback(
    (index: number): string | undefined => {
      if (visibleOptions && visibleOptions.length >= index) {
        const option = visibleOptions[index];
        return option ? option.value : undefined;
      }
    },
    [visibleOptions]
  );

  const getActiveChipIndex = useCallback(
    () =>
      isMultiselect(selection)
        ? selection.findIndex((value) =>
            getChipRef(value)?.current?.contains(document.activeElement)
          )
        : -1,
    [getChipRef, isMultiselect, selection]
  );

  /**
   *
   * Focus Management
   *
   */
  const getFocusedElementName = useCallback(() => {
    const isFocusOn = {
      Input: inputRef.current?.contains(document.activeElement),
      ClearButton: clearButtonRef.current?.contains(document.activeElement),
      Chip:
        isMultiselect(selection) &&
        selection.some((value) =>
          getChipRef(value)?.current?.contains(document.activeElement)
        ),
    };
    const getActiveChipIndex = () =>
      isMultiselect(selection)
        ? selection.findIndex((value) =>
            getChipRef(value)?.current?.contains(document.activeElement)
          )
        : -1;

    if (isMultiselect(selection) && isFocusOn.Chip) {
      if (getActiveChipIndex() === 0) {
        return 'FirstChip';
      } else if (getActiveChipIndex() === selection.length - 1) {
        return 'LastChip';
      }

      return 'MiddleChip';
    } else if (isFocusOn.Input) {
      return 'Input';
    } else if (isFocusOn.ClearButton) {
      return 'ClearButton';
    } else if (comboboxRef.current?.contains(document.activeElement)) {
      return 'Combobox';
    }
  }, [getChipRef, isMultiselect, selection]);

  type Direction = 'next' | 'prev' | 'first' | 'last';
  const updateFocusedOption = useCallback(
    (direction: Direction) => {
      const optionsCount = visibleOptions?.length ?? 0;
      const lastIndex = optionsCount - 1 > 0 ? optionsCount - 1 : 0;
      const indexOfFocus = getIndexOfValue(focusedOption);

      // Remove focus from chip
      if (direction && isOpen) {
        setFocusedChip(null);
        setInputFocus();
      }

      switch (direction) {
        case 'next': {
          const newValue =
            indexOfFocus + 1 < optionsCount
              ? getValueAtIndex(indexOfFocus + 1)
              : getValueAtIndex(0);

          setFocusedOption(newValue ?? null);
          break;
        }

        case 'prev': {
          const newValue =
            indexOfFocus - 1 >= 0
              ? getValueAtIndex(indexOfFocus - 1)
              : getValueAtIndex(lastIndex);

          setFocusedOption(newValue ?? null);
          break;
        }

        case 'last': {
          const newValue = getValueAtIndex(lastIndex);
          setFocusedOption(newValue ?? null);
          break;
        }

        case 'first':
        default: {
          const newValue = getValueAtIndex(0);
          setFocusedOption(newValue ?? null);
        }
      }
    },
    [
      focusedOption,
      getIndexOfValue,
      getValueAtIndex,
      isOpen,
      setInputFocus,
      visibleOptions?.length,
    ]
  );

  const updateFocusedChip = useCallback(
    (direction: Direction | null, relativeToIndex?: number) => {
      if (isMultiselect(selection)) {
        switch (direction) {
          case 'next': {
            const referenceChipIndex = relativeToIndex ?? getActiveChipIndex();
            const nextChipIndex =
              referenceChipIndex + 1 < selection.length
                ? referenceChipIndex + 1
                : selection.length - 1;
            const nextChipValue = selection[nextChipIndex];
            setFocusedChip(nextChipValue);
            break;
          }

          case 'prev': {
            const referenceChipIndex = relativeToIndex ?? getActiveChipIndex();
            const prevChipIndex =
              referenceChipIndex > 0
                ? referenceChipIndex - 1
                : referenceChipIndex < 0
                ? selection.length - 1
                : 0;
            const prevChipValue = selection[prevChipIndex];
            setFocusedChip(prevChipValue);
            break;
          }

          case 'first': {
            const firstChipValue = selection[0];
            setFocusedChip(firstChipValue);
            break;
          }

          case 'last': {
            const lastChipValue = selection[selection.length - 1];
            setFocusedChip(lastChipValue);
            break;
          }

          default:
            setFocusedChip(null);
            break;
        }
      }
    },
    [getActiveChipIndex, isMultiselect, selection]
  );

  const handleArrowKey = useCallback(
    (direction: 'left' | 'right', event: React.KeyboardEvent<Element>) => {
      // Remove focus from menu
      if (direction) setFocusedOption(null);

      const focusedElementName = getFocusedElementName();

      switch (direction) {
        case 'right':
          switch (focusedElementName) {
            case 'Input': {
              // If cursor is at the end of the input
              if (
                inputRef.current?.selectionEnd ===
                inputRef.current?.value.length
              ) {
                clearButtonRef.current?.focus();
              }
              break;
            }

            case 'LastChip': {
              // if focus is on last chip, go to input
              event.preventDefault();
              setInputFocus(0);
              updateFocusedChip(null);
              break;
            }

            case 'FirstChip':
            case 'MiddleChip': {
              updateFocusedChip('next');
              break;
            }

            case 'ClearButton':
            default:
              break;
          }
          break;

        case 'left':
          switch (focusedElementName) {
            case 'ClearButton': {
              event.preventDefault();
              setInputFocus(inputRef?.current?.value.length);
              break;
            }

            case 'Input':
            case 'MiddleChip':
            case 'LastChip': {
              if (isMultiselect(selection)) {
                // Break if cursor is not at the start of the input
                if (
                  focusedElementName === 'Input' &&
                  inputRef.current?.selectionStart !== 0
                ) {
                  break;
                }

                updateFocusedChip('prev');
              }
              break;
            }

            case 'FirstChip':
            default:
              break;
          }
          break;
        default:
          updateFocusedChip(null);
          break;
      }
    },
    [
      getFocusedElementName,
      isMultiselect,
      selection,
      setInputFocus,
      updateFocusedChip,
    ]
  );

  // Update the focused option when the inputValue changes
  useEffect(() => {
    if (inputValue !== prevValue) {
      updateFocusedOption('first');
    }
  }, [inputValue, isOpen, prevValue, updateFocusedOption]);

  // When the focused option chenges, update the menu scroll if necessary
  useEffect(() => {
    if (focusedOption) {
      const focusedElementRef = getOptionRef(focusedOption);

      if (focusedElementRef && focusedElementRef.current && menuRef.current) {
        const { offsetTop: optionTop } = focusedElementRef.current;
        const { scrollTop: menuScroll, offsetHeight: menuHeight } =
          menuRef.current;

        if (optionTop > menuHeight || optionTop < menuScroll) {
          menuRef.current.scrollTop = optionTop;
        }
      }
    }
  }, [focusedOption, getOptionRef]);

  /**
   *
   * Rendering
   *
   */
  const renderInternalOptions = useCallback(
    (_children: React.ReactNode) => {
      return React.Children.map(_children, (child) => {
        if (isComponentType(child, 'ComboboxOption')) {
          const { value, displayName } = getNameAndValue(child.props);

          if (isOptionVisible(value)) {
            const { className, glyph } = child.props;
            const index = allOptions.findIndex((opt) => opt.value === value);

            const isFocused = focusedOption === value;
            const isSelected = isMultiselect(selection)
              ? selection.includes(value)
              : selection === value;

            const setSelected = () => {
              setFocusedOption(value);
              updateSelection(value);
              setInputFocus();

              if (value === selection) {
                closeMenu();
              }
            };

            const optionRef = getOptionRef(value);

            return (
              <InternalComboboxOption
                value={value}
                displayName={displayName}
                isFocused={isFocused}
                isSelected={isSelected}
                setSelected={setSelected}
                glyph={glyph}
                className={className}
                index={index}
                ref={optionRef}
              />
            );
          }
        } else if (isComponentType(child, 'ComboboxGroup')) {
          const nestedChildren = renderInternalOptions(child.props.children);

          if (nestedChildren && nestedChildren?.length > 0) {
            return (
              <InternalComboboxGroup
                label={child.props.label}
                className={child.props.className}
              >
                {renderInternalOptions(nestedChildren)}
              </InternalComboboxGroup>
            );
          }
        }
      });
    },
    [
      allOptions,
      focusedOption,
      getOptionRef,
      isMultiselect,
      isOptionVisible,
      selection,
      setInputFocus,
      updateSelection,
    ]
  );

  const renderedOptions = useMemo(
    () => renderInternalOptions(children),
    [children, renderInternalOptions]
  );

  const renderedChips = useMemo(() => {
    if (isMultiselect(selection)) {
      return selection.filter(isValueValid).map((value, index) => {
        const displayName = getDisplayNameForValue(value);

        const onRemove = () => {
          updateFocusedChip('next', index);
          updateSelection(value);
        };

        const isFocused = focusedChip === value;
        const chipRef = getChipRef(value);

        const onFocus = () => {
          setFocusedChip(value);
        };

        return (
          <Chip
            key={value}
            displayName={displayName}
            isFocused={isFocused}
            onRemove={onRemove}
            onFocus={onFocus}
            ref={chipRef}
          />
        );
      });
    }
  }, [
    isMultiselect,
    selection,
    isValueValid,
    getDisplayNameForValue,
    focusedChip,
    getChipRef,
    updateFocusedChip,
    updateSelection,
  ]);

  const renderedInputIcons = useMemo(() => {
    const handleClearButtonClick = (
      e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
      if (!disabled) {
        updateSelection(null);
        onClear?.(e);
        onFilter?.('');
        if (!isOpen) {
          openMenu();
        }
      }
    };

    return (
      <>
        {clearable && doesSelectionExist && (
          <IconButton
            aria-label="Clear selection"
            aria-disabled={disabled}
            disabled={disabled}
            ref={clearButtonRef}
            onClick={handleClearButtonClick}
            onFocus={handleClearButtonFocus}
            className={clearButton}
          >
            <Icon glyph="XWithCircle" />
          </IconButton>
        )}
        {state === 'error' ? (
          <Icon glyph="Warning" color={uiColors.red.base} className={endIcon} />
        ) : (
          <Icon glyph="CaretDown" className={endIcon} />
        )}
      </>
    );
  }, [
    clearable,
    doesSelectionExist,
    disabled,
    state,
    updateSelection,
    onClear,
    onFilter,
    isOpen,
  ]);

  // Do any of the options have an icon?
  const withIcons = useMemo(
    () => allOptions.some((opt) => opt.hasGlyph),
    [allOptions]
  );

  /**
   *
   * Selection Management
   *
   */
  const onCloseMenu = useCallback(() => {
    if (!isMultiselect(selection) && selection === prevSelection) {
      const exactMatchedOption = visibleOptions.find(
        (option) =>
          option.displayName === inputValue || option.value === inputValue
      );

      // check if inputValue is matches a valid option
      // Set the selection to that value if the component is not controlled
      if (exactMatchedOption && !value) {
        setSelection(exactMatchedOption.value as SelectValueType<M>);
      } else {
        // Revert the value to the previous selection
        const displayName = getDisplayNameForValue(selection) ?? '';
        setInputValue(displayName);
      }
    }
  }, [
    getDisplayNameForValue,
    inputValue,
    isMultiselect,
    prevSelection,
    selection,
    value,
    visibleOptions,
  ]);

  const onSelect = useCallback(() => {
    if (doesSelectionExist) {
      if (isMultiselect(selection)) {
        // Scroll the wrapper to the end. No effect if not `overflow="scroll-x"`
        scrollToEnd();
      } else if (!isMultiselect(selection)) {
        // Update the text input
        const displayName =
          getDisplayNameForValue(selection as SelectValueType<false>) ?? '';
        setInputValue(displayName);
        closeMenu();
      }
    } else {
      setInputValue('');
    }
  }, [doesSelectionExist, getDisplayNameForValue, isMultiselect, selection]);

  // Set initialValue
  useEffect(() => {
    if (initialValue) {
      if (isArray(initialValue)) {
        // Ensure the values we set are real options
        const filteredValue =
          initialValue.filter((value) => isValueValid(value)) ?? [];
        setSelection(filteredValue as SelectValueType<M>);
      } else {
        if (isValueValid(initialValue)) {
          setSelection(initialValue);
        }
      }
    } else {
      setSelection(getNullSelection(multiselect));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When controlled value changes, update the selection
  useEffect(() => {
    if (!isUndefined(value) && value !== prevValue) {
      if (isNull(value)) {
        setSelection(null);
      } else if (isMultiselect(value)) {
        // Ensure the value(s) passed in are valid options
        const newSelection = value.filter(isValueValid) as SelectValueType<M>;
        setSelection(newSelection);
      } else {
        setSelection(
          isValueValid(value as SelectValueType<false>) ? value : null
        );
      }
    }
  }, [isMultiselect, isValueValid, prevValue, value]);

  // onSelect
  // Side effects to run when the selection changes
  useEffect(() => {
    if (selection !== prevSelection) {
      onSelect();
    }
  }, [onSelect, prevSelection, selection]);

  // when the menu closes, update the value if needed
  useEffect(() => {
    if (!isOpen && prevOpenState !== isOpen) {
      onCloseMenu();
    }
  }, [isOpen, prevOpenState, onCloseMenu]);

  /**
   *
   * Menu management
   *
   */
  const closeMenu = () => setOpen(false);
  const openMenu = () => setOpen(true);

  const [menuWidth, setMenuWidth] = useState(0);
  useEffect(() => {
    setMenuWidth(comboboxRef.current?.clientWidth ?? 0);
  }, [comboboxRef, isOpen, focusedOption, selection]);
  const handleTransitionEnd = () => {
    setMenuWidth(comboboxRef.current?.clientWidth ?? 0);
  };

  const renderedMenuContents = useMemo((): JSX.Element => {
    switch (searchState) {
      case 'loading': {
        return (
          <span className={menuMessage}>
            <Icon
              glyph="Refresh"
              color={uiColors.blue.base}
              className={loadingIconStyle}
            />
            {searchLoadingMessage}
          </span>
        );
      }

      case 'error': {
        return (
          <span className={menuMessage}>
            <Icon glyph="Warning" color={uiColors.red.base} />
            {searchErrorMessage}
          </span>
        );
      }

      case 'unset':
      default: {
        if (renderedOptions && renderedOptions.length > 0) {
          return <ul className={menuList}>{renderedOptions}</ul>;
        }

        return <span className={menuMessage}>{searchEmptyMessage}</span>;
      }
    }
  }, [
    renderedOptions,
    searchEmptyMessage,
    searchErrorMessage,
    searchLoadingMessage,
    searchState,
  ]);

  const viewportSize = useViewportSize();

  // Set the max height of the menu
  const maxHeight = useMemo(() => {
    // TODO - consolidate this hook with Select/ListMenu
    const maxMenuHeight = 274;
    const menuMargin = 8;

    if (viewportSize && comboboxRef.current && menuRef.current) {
      const { top: triggerTop, bottom: triggerBottom } =
        comboboxRef.current.getBoundingClientRect();

      // Find out how much space is available above or below the trigger
      const safeSpace = Math.max(
        viewportSize.height - triggerBottom,
        triggerTop
      );

      // if there's more than enough space, set to maxMenuHeight
      // otherwise fill the space available
      return Math.min(maxMenuHeight, safeSpace - menuMargin);
    }

    return maxMenuHeight;
  }, [viewportSize, comboboxRef, menuRef]);

  // Scroll the menu when the focus changes
  useEffect(() => {
    // get the focused option
  }, [focusedOption]);

  /**
   *
   * Event Handlers
   *
   */
  // Prevent combobox from gaining focus by default
  const handleInputWrapperMousedown = (e: React.MouseEvent) => {
    if (e.target !== inputRef.current) {
      e.preventDefault();
    }
  };

  // Set focus to the input element on click
  const handleInputWrapperClick = (e: React.MouseEvent) => {
    if (e.target !== inputRef.current) {
      let cursorPos = 0;

      if (inputRef.current) {
        const mouseX = e.nativeEvent.offsetX;
        const inputRight =
          inputRef.current.offsetLeft + inputRef.current.clientWidth;
        cursorPos = mouseX > inputRight ? inputValue.length : 0;
      }

      setInputFocus(cursorPos);
    }

    // Open menu on click instead of on focus.
    // https://jira.mongodb.org/browse/PD-2321
    openMenu();
  };

  // Fired when the wrapper gains focus
  const handleInputWrapperFocus = () => {
    scrollToEnd();
    // To prevent Combobox menu from automatically being opened on focus.
    // https://jira.mongodb.org/browse/PD-2321
    // openMenu();
  };

  // Fired onChange
  const handleInputChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(value);
    // fire any filter function passed in
    onFilter?.(value);
  };

  const handleClearButtonFocus = () => {
    setFocusedOption(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const isFocusInMenu = menuRef.current?.contains(document.activeElement);
    const isFocusOnCombobox = comboboxRef.current?.contains(
      document.activeElement
    );

    const isFocusInComponent = isFocusOnCombobox || isFocusInMenu;

    if (isFocusInComponent) {
      // No support for modifiers yet
      // TODO - Handle support for multiple chip selection
      if (event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const focusedElement = getFocusedElementName();

      switch (event.keyCode) {
        case keyMap.Tab: {
          switch (focusedElement) {
            case 'Input': {
              if (!doesSelectionExist) {
                closeMenu();
                updateFocusedOption('first');
                updateFocusedChip(null);
              }
              // else use default behavior
              break;
            }

            case 'LastChip': {
              // use default behavior
              updateFocusedChip(null);
              break;
            }

            case 'FirstChip':
            case 'MiddleChip': {
              // use default behavior
              break;
            }

            case 'ClearButton':
            default:
              break;
          }

          break;
        }

        case keyMap.Escape: {
          closeMenu();
          updateFocusedOption('first');
          break;
        }

        case keyMap.Enter:
        case keyMap.Space: {
          if (isOpen) {
            // prevent typing the space character
            event.preventDefault();
          }

          if (
            // Focused on input element
            document.activeElement === inputRef.current &&
            isOpen &&
            !isNull(focusedOption)
          ) {
            updateSelection(focusedOption);
          } else if (
            // Focused on clear button
            document.activeElement === clearButtonRef.current
          ) {
            updateSelection(null);
            setInputFocus();
          }
          break;
        }

        case keyMap.Backspace: {
          // Backspace key focuses last chip
          // Delete key does not
          if (
            isMultiselect(selection) &&
            inputRef.current?.selectionStart === 0
          ) {
            updateFocusedChip('last');
          } else {
            openMenu();
          }
          break;
        }

        case keyMap.ArrowDown: {
          if (isOpen) {
            // Prevent the page from scrolling
            event.preventDefault();
          }
          openMenu();
          updateFocusedOption('next');
          break;
        }

        case keyMap.ArrowUp: {
          if (isOpen) {
            // Prevent the page from scrolling
            event.preventDefault();
          }
          updateFocusedOption('prev');
          break;
        }

        case keyMap.ArrowRight: {
          handleArrowKey('right', event);
          break;
        }

        case keyMap.ArrowLeft: {
          handleArrowKey('left', event);
          break;
        }

        default: {
          if (!isOpen) {
            openMenu();
          }
        }
      }
    }
  };

  /**
   *
   * Global Event Handler
   *
   */
  // Global backdrop click handler
  const handleBackdropClick = ({ target }: MouseEvent) => {
    const isChildFocused =
      menuRef.current?.contains(target as Node) ||
      comboboxRef.current?.contains(target as Node) ||
      false;

    if (!isChildFocused) {
      setOpen(false);
    }
  };
  useEventListener('mousedown', handleBackdropClick);

  return (
    <ComboboxContext.Provider
      value={{
        multiselect,
        darkMode,
        size,
        withIcons,
        disabled,
        chipTruncationLocation,
        chipCharacterLimit,
        inputValue,
      }}
    >
      <div
        className={cx(
          comboboxParentStyle({ darkMode, size, overflow }),
          className
        )}
        {...rest}
      >
        <div>
          {label && (
            <Label id={labelId} htmlFor={inputId}>
              {label}
            </Label>
          )}
          {description && <Description>{description}</Description>}
        </div>

        <InteractionRing
          className={interactionRingStyle}
          disabled={disabled}
          color={interactionRingColor({ state, darkMode })}
        >
          {/* Disable eslint: onClick sets focus. Key events would already have focus */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
          <div
            ref={comboboxRef}
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={menuId}
            aria-owns={menuId}
            tabIndex={-1}
            className={comboboxStyle}
            onMouseDown={handleInputWrapperMousedown}
            onClick={handleInputWrapperClick}
            onFocus={handleInputWrapperFocus}
            onKeyDown={handleKeyDown}
            onTransitionEnd={handleTransitionEnd}
            data-disabled={disabled}
            data-state={state}
          >
            <div
              ref={inputWrapperRef}
              className={inputWrapperStyle({
                overflow,
                isOpen,
                selection,
                value: inputValue,
              })}
            >
              {renderedChips}
              <input
                aria-label={ariaLabel ?? label}
                aria-autocomplete="list"
                aria-controls={menuId}
                aria-labelledby={labelId}
                ref={inputRef}
                id={inputId}
                className={inputElementStyle}
                placeholder={placeholderValue}
                disabled={disabled ?? undefined}
                onChange={handleInputChange}
                value={inputValue}
                autoComplete="off"
              />
            </div>
            {renderedInputIcons}
          </div>
        </InteractionRing>

        {state === 'error' && errorMessage && (
          <div className={errorMessageStyle}>{errorMessage}</div>
        )}

        {/******* /
          *  Menu  *
          / *******/}
        <Popover
          active={isOpen && !disabled}
          spacing={4}
          align="bottom"
          justify="middle"
          refEl={comboboxRef}
          adjustOnMutation={true}
          className={cx(
            popoverStyle(),
            menuWrapperStyle({ darkMode, size, width: menuWidth })
          )}
          usePortal={false} // combobox@0.9.0 does not have implemented functionality for usePortal yet.
          popoverZIndex={999999}
        >
          <div
            id={menuId}
            role="listbox"
            aria-labelledby={labelId}
            aria-expanded={isOpen}
            ref={menuRef}
            className={menuStyle({ maxHeight })}
            onMouseDownCapture={(e) => e.preventDefault()}
          >
            {renderedMenuContents}
          </div>
        </Popover>
      </div>
    </ComboboxContext.Provider>
  );
}
