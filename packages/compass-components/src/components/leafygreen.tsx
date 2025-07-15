import React, { useState } from 'react';

// This file exports `@leafygreen-ui` components and wraps some of them.

// 1. Import the components we use from leafygreen.
import { default as Badge } from '@leafygreen-ui/badge';
import { default as Banner } from '@leafygreen-ui/banner';
import Checkbox from '@leafygreen-ui/checkbox';
import Card from '@leafygreen-ui/card';
import Code, { Language, Panel as CodePanel } from '@leafygreen-ui/code';
import ConfirmationModal from '@leafygreen-ui/confirmation-modal';
import { default as LeafyGreenIcon } from '@leafygreen-ui/icon';
import type { Size as LeafyGreenIconSize } from '@leafygreen-ui/icon';
export type { GlyphName } from '@leafygreen-ui/icon';
import { Chip } from '@leafygreen-ui/chip';
import {
  AtlasNavGraphic,
  MongoDBLogoMark,
  MongoDBLogo,
} from '@leafygreen-ui/logo';
import {
  Menu,
  MenuSeparator,
  MenuItem,
  getLgIds as getLgIdsMenu,
} from '@leafygreen-ui/menu';
export type { MenuItemProps } from '@leafygreen-ui/menu';
import { InfoSprinkle } from '@leafygreen-ui/info-sprinkle';
import {
  Drawer,
  DisplayMode as DrawerDisplayMode,
  DrawerLayout,
  DrawerStackProvider,
  useDrawerStackContext,
  useDrawerToolbarContext,
} from '@leafygreen-ui/drawer';

// If a leafygreen Menu (and therefore MenuItems) makes its way into a <form>,
// clicking on a menu item will submit that form. This is because it uses a button
// tag without specifying a type and buttons by default have type="submit".
(MenuItem as any).defaultProps = {
  ...(MenuItem as any).defaultProps,
  type: 'button',
};

import Modal, { Footer as ModalFooter } from '@leafygreen-ui/modal';
import MarketingModal from '@leafygreen-ui/marketing-modal';
import { Pipeline, Stage } from '@leafygreen-ui/pipeline';
import Popover from '@leafygreen-ui/popover';
import { RadioBox, RadioBoxGroup } from '@leafygreen-ui/radio-box-group';
import { Radio, RadioGroup } from '@leafygreen-ui/radio-group';
import {
  SegmentedControl,
  SegmentedControlOption as LGSegmentedControlOption,
  type SegmentedControlOptionProps,
} from '@leafygreen-ui/segmented-control';
import { Select, Option, OptionGroup } from '@leafygreen-ui/select';
import {
  Cell,
  HeaderCell,
  HeaderRow,
  ExpandedContent,
  Row,
  Table,
  TableHead,
  TableBody,
  flexRender,
  useLeafyGreenTable,
  getExpandedRowModel,
  getFilteredRowModel,
} from '@leafygreen-ui/table';
import type { Row as LgTableRowType } from '@tanstack/table-core'; // TODO(COMPASS-8437): import from LG

export type {
  LGColumnDef,
  HeaderGroup,
  LeafyGreenTableCell,
  LeafyGreenTableRow,
  LGTableDataType,
  LGRowData,
  SortingState,
} from '@leafygreen-ui/table';
import { Tabs, Tab } from '@leafygreen-ui/tabs';
import TextArea from '@leafygreen-ui/text-area';
import LeafyGreenTextInput from '@leafygreen-ui/text-input';
import { SearchInput } from '@leafygreen-ui/search-input';
export { usePrevious, useMergeRefs } from '@leafygreen-ui/hooks';
import Toggle from '@leafygreen-ui/toggle';
import Tooltip from '@leafygreen-ui/tooltip';
import {
  H1 as LGH1,
  H2 as LGH2,
  H3 as LGH3,
  Subtitle as LGSubtitle,
  Body as LGBody,
  InlineCode,
  InlineKeyCode,
  Disclaimer,
  Overline as LGOverline,
  Label as LGLabel,
  Description as LGDescription,
  type LabelProps,
  type H1Props,
  type H2Props,
  type H3Props,
  type SubtitleProps,
  type BodyProps,
  type OverlineProps,
  type DescriptionProps,
} from '@leafygreen-ui/typography';

// Workaround until https://jira.mongodb.org/browse/LG-5354 is resolved
const H1 = LGH1 as React.FC<H1Props>;
const H2 = LGH2 as React.FC<H2Props>;
const H3 = LGH3 as React.FC<H3Props>;
const Subtitle = LGSubtitle as React.FC<SubtitleProps>;
const Body = LGBody as React.FC<BodyProps>;
const Overline = LGOverline as React.FC<OverlineProps>;
const Description = LGDescription as React.FC<DescriptionProps>;
const Label = LGLabel as React.FC<LabelProps>;
const SegmentedControlOption =
  LGSegmentedControlOption as React.FC<SegmentedControlOptionProps>;

import {
  Combobox,
  ComboboxOption,
  ComboboxGroup,
} from '@leafygreen-ui/combobox';

// 2. Wrap and make any changes/workaround to leafygreen components.
const Icon = ({
  size,
  ...rest
}: Omit<React.ComponentProps<typeof LeafyGreenIcon>, 'size'> & {
  size?: LeafyGreenIconSize | 'xsmall' | number;
}) => {
  size = size === 'xsmall' ? 12 : size;
  return <LeafyGreenIcon size={size} {...rest} />;
};
Icon.isGlyph = true;

delete (MarketingModal as React.ComponentType<any>).propTypes;
delete (Checkbox as React.ComponentType<any>).propTypes;

// We wrap these so that we can add the utm_source and utm_medium parameters to
// all hrefs.
export { Link, Button, IconButton } from './links/link';

// Working around leafygreen lack of support for `defaultValue` property
const TextInput: typeof LeafyGreenTextInput = React.forwardRef(
  function TextInput({ defaultValue, value, onChange, ...props }, ref) {
    const [uncontrolledValue, setUncontrolledValue] = useState(
      String(defaultValue) ?? ''
    );
    const isControlled = typeof defaultValue === 'undefined';
    return (
      <LeafyGreenTextInput
        {...props}
        value={isControlled ? value : uncontrolledValue}
        onChange={(e) => {
          setUncontrolledValue(e.currentTarget.value);
          onChange?.(e);
        }}
        ref={ref}
      ></LeafyGreenTextInput>
    );
  }
);

TextInput.displayName = 'TextInput';

// 3. Export the leafygreen components.
export {
  AtlasNavGraphic,
  Badge,
  Banner,
  Card,
  Checkbox,
  Chip,
  Code,
  CodePanel,
  ConfirmationModal,
  ExpandedContent,
  HeaderCell,
  HeaderRow,
  Icon,
  Language,
  Menu,
  MenuItem,
  MenuSeparator,
  getLgIdsMenu,
  Modal,
  ModalFooter,
  MarketingModal,
  MongoDBLogoMark,
  MongoDBLogo,
  Pipeline,
  Popover,
  RadioBox,
  RadioBoxGroup,
  Radio,
  RadioGroup,
  SegmentedControl,
  SegmentedControlOption,
  Select,
  Option,
  OptionGroup,
  Table,
  TableBody,
  TableHead,
  Row,
  Cell,
  Stage,
  Tab,
  Tabs,
  TextArea,
  TextInput,
  Toggle,
  Tooltip,
  H1,
  H2,
  H3,
  Subtitle,
  Body,
  InlineCode,
  InlineKeyCode,
  Disclaimer,
  Overline,
  Label,
  Description,
  SearchInput,
  InfoSprinkle,
  flexRender,
  useLeafyGreenTable,
  getExpandedRowModel,
  getFilteredRowModel,
  type LgTableRowType,
  Combobox,
  ComboboxGroup,
  ComboboxOption,
  Drawer,
  DrawerDisplayMode,
  DrawerLayout,
  DrawerStackProvider,
  useDrawerStackContext,
  useDrawerToolbarContext,
};
