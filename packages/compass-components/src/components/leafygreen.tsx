import React from 'react';

// This file exports `@leafygreen-ui` components and wraps some of them.

// 1. Import the components we use from leafygreen.
import { default as Badge } from '@leafygreen-ui/badge';
import { default as Banner } from '@leafygreen-ui/banner';
import Button from '@leafygreen-ui/button';
import Checkbox from '@leafygreen-ui/checkbox';
import Card from '@leafygreen-ui/card';
import Code, { Language } from '@leafygreen-ui/code';
import {
  Combobox,
  ComboboxOption,
  ComboboxGroup,
} from '@leafygreen-ui/combobox';
import ConfirmationModal from '@leafygreen-ui/confirmation-modal';
import { default as LeafyGreenIcon } from '@leafygreen-ui/icon';
import type { Size as LeafyGreenIconSize } from '@leafygreen-ui/icon';
import IconButton from '@leafygreen-ui/icon-button';
import {
  AtlasNavGraphic,
  MongoDBLogoMark,
  MongoDBLogo,
} from '@leafygreen-ui/logo';
import { Menu, MenuSeparator, MenuItem } from '@leafygreen-ui/menu';

// If a leafygreen Menu (and therefore MenuItems) makes its way into a <form>,
// clicking on a menu item will submit that form. This is because it uses a button
// tag without specifying a type and buttons by default have type="submit".
MenuItem.defaultProps = {
  ...MenuItem.defaultProps,
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
  SegmentedControlOption,
} from '@leafygreen-ui/segmented-control';
import { Select, Option, OptionGroup } from '@leafygreen-ui/select';
import { Table, TableHeader, Row, Cell } from '@leafygreen-ui/table';
import { Tabs, Tab } from '@leafygreen-ui/tabs';
import TextArea from '@leafygreen-ui/text-area';
import TextInput from '@leafygreen-ui/text-input';
import {
  default as Toast,
  Variant as ToastVariant,
} from '@leafygreen-ui/toast';
import Toggle from '@leafygreen-ui/toggle';
import {
  H1,
  H2,
  H3,
  Subtitle,
  Body,
  InlineCode,
  InlineKeyCode,
  Disclaimer,
  Overline,
  Link,
  Label,
  Description,
} from '@leafygreen-ui/typography';

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

// 3. Export the leafygreen components.
export {
  AtlasNavGraphic,
  Badge,
  Banner,
  Button,
  Card,
  Checkbox,
  Code,
  ConfirmationModal,
  Icon,
  IconButton,
  Language,
  Menu,
  MenuItem,
  MenuSeparator,
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
  TableHeader,
  Row,
  Cell,
  Stage,
  Tab,
  Tabs,
  TextArea,
  TextInput,
  Toast,
  ToastVariant,
  Toggle,
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
  Link,
  Description,
  Combobox,
  ComboboxOption,
  ComboboxGroup,
};
