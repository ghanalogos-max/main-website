// MingCute icons (https://www.mingcute.com) used across the site.
import { forwardRef, type ComponentType } from "react";
import type { IconProps } from "@mingcute/react";
import Down from "@mingcute/react/core-regular/down";
import ArrowLeft from "@mingcute/react/core-regular/arrow-left";
import ArrowRight from "@mingcute/react/core-regular/arrow-right";
import Check from "@mingcute/react/core-regular/check";
import Close from "@mingcute/react/core-regular/close";
import Copy2 from "@mingcute/react/core-regular/copy-2";
import VIP2 from "@mingcute/react/core-filled/vip-2";
import Download2 from "@mingcute/react/core-regular/download-2";
import Folder2 from "@mingcute/react/core-regular/folder-2";
import Github from "@mingcute/react/core-regular/github";
import Heart from "@mingcute/react/core-filled/heart";
import Pic2 from "@mingcute/react/core-regular/pic-2";
import Information from "@mingcute/react/core-regular/information";
import Link2 from "@mingcute/react/core-regular/link-2";
import Loading3 from "@mingcute/react/core-regular/loading-3";
import Lock from "@mingcute/react/core-regular/lock";
import Mail from "@mingcute/react/core-regular/mail";
import Menu from "@mingcute/react/core-regular/menu";
import Moon from "@mingcute/react/core-regular/moon";
import Refresh2 from "@mingcute/react/core-regular/refresh-2";
import Search2 from "@mingcute/react/core-regular/search-2";
import SafeShield from "@mingcute/react/core-filled/safe-shield";
import Star from "@mingcute/react/core-filled/star";
import Sun from "@mingcute/react/core-regular/sun";
import Time from "@mingcute/react/core-regular/time";
import Upload2 from "@mingcute/react/core-regular/upload-2";
import VectorBezier2 from "@mingcute/react/core-regular/vector-bezier-2";
import Add from "@mingcute/react/core-regular/add";
import Book2 from "@mingcute/react/core-regular/book-2";
import Building2 from "@mingcute/react/core-regular/building-2";
import ChartBar from "@mingcute/react/core-regular/chart-bar";
import Code from "@mingcute/react/core-regular/code";
import Delete2 from "@mingcute/react/core-regular/delete-2";
import Exit from "@mingcute/react/core-regular/exit";
import Flash from "@mingcute/react/core-regular/flash";
import Group from "@mingcute/react/core-regular/group";
import Key2 from "@mingcute/react/core-regular/key-2";
import TerminalBox from "@mingcute/react/core-regular/terminal-box";
import User3 from "@mingcute/react/core-regular/user-3";
import Eye from "@mingcute/react/core-regular/eye";
import EyeClose from "@mingcute/react/core-regular/eye-close";
import Google from "@mingcute/react/core-regular/google";
import Ticket from "@mingcute/react/core-regular/ticket";
import Phone from "@mingcute/react/core-regular/phone";

type Icon = ComponentType<IconProps>;

// MingCute sets an inline `color` style by default, which overrides Tailwind
// `text-*` classes. An empty colour drops that style so classes apply.
function themed(Base: Icon, name: string): Icon {
  const Themed = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
    <Base color="" {...props} ref={ref} />
  ));
  Themed.displayName = name;
  return Themed as Icon;
}

export const ArrowDownIcon = themed(Down, "ArrowDownIcon");
export const ArrowLeftIcon = themed(ArrowLeft, "ArrowLeftIcon");
export const ArrowRightIcon = themed(ArrowRight, "ArrowRightIcon");
export const CheckIcon = themed(Check, "CheckIcon");
export const CloseIcon = themed(Close, "CloseIcon");
export const CopyIcon = themed(Copy2, "CopyIcon");
export const CrownIcon = themed(VIP2, "CrownIcon");
export const DownloadIcon = themed(Download2, "DownloadIcon");
export const FolderIcon = themed(Folder2, "FolderIcon");
export const GithubIcon = themed(Github, "GithubIcon");
export const HeartIcon = themed(Heart, "HeartIcon");
export const ImageIcon = themed(Pic2, "ImageIcon");
export const InfoIcon = themed(Information, "InfoIcon");
export const LinkIcon = themed(Link2, "LinkIcon");
export const LoadingIcon = themed(Loading3, "LoadingIcon");
export const LockIcon = themed(Lock, "LockIcon");
export const MailIcon = themed(Mail, "MailIcon");
export const MenuIcon = themed(Menu, "MenuIcon");
export const MoonIcon = themed(Moon, "MoonIcon");
export const RefreshIcon = themed(Refresh2, "RefreshIcon");
export const SearchIcon = themed(Search2, "SearchIcon");
export const ShieldIcon = themed(SafeShield, "ShieldIcon");
export const StarIcon = themed(Star, "StarIcon");
export const SunIcon = themed(Sun, "SunIcon");
export const TimeIcon = themed(Time, "TimeIcon");
export const UploadIcon = themed(Upload2, "UploadIcon");
export const VectorIcon = themed(VectorBezier2, "VectorIcon");
export const AddIcon = themed(Add, "AddIcon");
export const BookIcon = themed(Book2, "BookIcon");
export const BuildingIcon = themed(Building2, "BuildingIcon");
export const ChartIcon = themed(ChartBar, "ChartIcon");
export const CodeIcon = themed(Code, "CodeIcon");
export const DeleteIcon = themed(Delete2, "DeleteIcon");
export const ExitIcon = themed(Exit, "ExitIcon");
export const FlashIcon = themed(Flash, "FlashIcon");
export const TeamIcon = themed(Group, "TeamIcon");
export const KeyIcon = themed(Key2, "KeyIcon");
export const TerminalIcon = themed(TerminalBox, "TerminalIcon");
export const UserIcon = themed(User3, "UserIcon");
export const EyeIcon = themed(Eye, "EyeIcon");
export const EyeOffIcon = themed(EyeClose, "EyeOffIcon");
export const GoogleIcon = themed(Google, "GoogleIcon");
export const TicketIcon = themed(Ticket, "TicketIcon");
export const PhoneIcon = themed(Phone, "PhoneIcon");
