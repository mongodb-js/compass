import { withTheme } from '../../hooks/use-theme';

// This file wraps the leafygreen-ui packages with
// a listener to Compass' theme in the react context.


// 1. Import the components we use from leafygreen.
import {
  default as LeafyGreenBadge,
} from '@leafygreen-ui/badge';
import {
  default as LeafyGreenBanner,
} from '@leafygreen-ui/banner';
import {
  default as LeafyGreenButton
} from '@leafygreen-ui/button';
import { default as LeafyGreenCard } from '@leafygreen-ui/card';
import { default as LeafyGreenIcon } from '@leafygreen-ui/icon';
import { default as LeafyGreenIconButton } from '@leafygreen-ui/icon-button';
import {
  AtlasLogoMark as LeafyGreenAtlasLogoMark,
  MongoDBLogoMark as LeafyGreenMongoDBLogoMark,
  MongoDBLogo as LeafyGreenMongoDBLogo,
} from '@leafygreen-ui/logo';
import { Menu as LeafyGreenMenu, MenuSeparator as LeafyGreenMenuSeparator, MenuItem as LeafyGreenMenuItem } from '@leafygreen-ui/menu';
import { RadioBox as LeafyGreenRadioBox } from '@leafygreen-ui/radio-box-group';
import { Radio as LeafyGreenRadio, RadioGroup as LeafyGreenRadioGroup } from '@leafygreen-ui/radio-group';
import {
  SegmentedControl as LeafyGreenSegmentedControl,
  SegmentedControlOption as LeafyGreenSegmentedControlOption,
} from '@leafygreen-ui/segmented-control';
import {
  Select as LeafyGreenSelect,
  Option as LeafyGreenOption,
  OptionGroup as LeafyGreenOptionGroup,
} from '@leafygreen-ui/select';
import { Table as LeafyGreenTable, TableHeader as LeafyGreenTableHeader, Row as LeafyGreenRow, Cell as LeafyGreenCell } from '@leafygreen-ui/table';
import { Tabs as LeafyGreenTabs, Tab as LeafyGreenTab } from '@leafygreen-ui/tabs';
import { default as LeafyGreenTextArea } from '@leafygreen-ui/text-area';
import { default as LeafyGreenTextInput } from '@leafygreen-ui/text-input';
import {
  default as LeafyGreenToast,
} from '@leafygreen-ui/toast';
import { default as LeafyGreenToggle } from '@leafygreen-ui/toggle';
import {
  H1 as LeafyGreenH1,
  H2 as LeafyGreenH2,
  H3 as LeafyGreenH3,
  Subtitle as LeafyGreenSubtitle,
  Body as LeafyGreenBody,
  InlineCode as LeafyGreenInlineCode,
  InlineKeyCode as LeafyGreenInlineKeyCode,
  Disclaimer as LeafyGreenDisclaimer,
  Overline as LeafyGreenOverline,
  Label as LeafyGreenLabel,
  Link as LeafyGreenLink,
  Description as LeafyGreenDescription,
} from '@leafygreen-ui/typography';

// 2. Wrap the components with Compass' theme.
const Badge = withTheme(LeafyGreenBadge);
const Banner = withTheme(LeafyGreenBanner);
const Button = withTheme(LeafyGreenButton);
const Card = withTheme(LeafyGreenCard);
const Icon = withTheme(LeafyGreenIcon);
const IconButton = withTheme(LeafyGreenIconButton);
const AtlasLogoMark = withTheme(LeafyGreenAtlasLogoMark);
const MongoDBLogoMark = withTheme(LeafyGreenMongoDBLogoMark);
const MongoDBLogo = withTheme(LeafyGreenMongoDBLogo);
const Menu = withTheme(LeafyGreenMenu);
const MenuItem = withTheme(LeafyGreenMenuItem);
const MenuSeparator = withTheme(LeafyGreenMenuSeparator);
const RadioBox = withTheme(LeafyGreenRadioBox);
const Radio = withTheme(LeafyGreenRadio);
const RadioGroup = withTheme(LeafyGreenRadioGroup);
const SegmentedControl = withTheme(LeafyGreenSegmentedControl);
const SegmentedControlOption = withTheme(LeafyGreenSegmentedControlOption);
const Select = withTheme(LeafyGreenSelect);
const Option = withTheme(LeafyGreenOption);
const OptionGroup = withTheme(LeafyGreenOptionGroup);
const Table = withTheme(LeafyGreenTable);
const TableHeader = withTheme(LeafyGreenTableHeader);
const Row = withTheme(LeafyGreenRow);
const Cell = withTheme(LeafyGreenCell);
const Tab = withTheme(LeafyGreenTab);
const Tabs = withTheme(LeafyGreenTabs);
const TextArea = withTheme(LeafyGreenTextArea);
const TextInput = withTheme(LeafyGreenTextInput);
const Toast = withTheme(LeafyGreenToast);
const Toggle = withTheme(LeafyGreenToggle);

const H1 = withTheme(LeafyGreenH1);
const H2 = withTheme(LeafyGreenH2);
const H3 = withTheme(LeafyGreenH3);
const Subtitle = withTheme(LeafyGreenSubtitle);
const Body = withTheme(LeafyGreenBody);
const InlineCode = withTheme(LeafyGreenInlineCode);
const InlineKeyCode = withTheme(LeafyGreenInlineKeyCode);
const Disclaimer = withTheme(LeafyGreenDisclaimer);
const Overline = withTheme(LeafyGreenOverline);
const Label = withTheme(LeafyGreenLabel);
const Link = withTheme(LeafyGreenLink);
const Description = withTheme(LeafyGreenDescription);

// 3. Export leafygreen components.

export {
  Badge,
  Banner,
  Button,
  Card,
  Icon,
  IconButton,
  AtlasLogoMark,
  MongoDBLogoMark,
  MongoDBLogo,
  Menu,
  MenuItem,
  MenuSeparator,
  RadioBox,
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
  Tab,
  Tabs,
  TextArea,
  TextInput,
  Toast,
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
};
