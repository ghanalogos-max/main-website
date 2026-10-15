import type { IconProps } from "@mingcute/react";
import {
  AirplaneIcon,
  BankIcon,
  CartIcon,
  ChipIcon,
  EnergyIcon,
  FactoryIcon,
  FirstAidIcon,
  FlagIcon,
  FolderIcon,
  FootballIcon,
  GovernmentIcon,
  GraduationIcon,
  HandHeartIcon,
  SignalIcon,
  TvIcon,
  UmbrellaIcon,
} from "./icons";

const ICONS: Record<string, typeof FolderIcon> = {
  "banks-finance": BankIcon,
  telecom: SignalIcon,
  "fintech-technology": ChipIcon,
  government: GovernmentIcon,
  "energy-mining": EnergyIcon,
  "transport-aviation": AirplaneIcon,
  education: GraduationIcon,
  media: TvIcon,
  "fmcg-retail": CartIcon,
  insurance: UmbrellaIcon,
  sports: FootballIcon,
  health: FirstAidIcon,
  "political-parties": FlagIcon,
  manufacturing: FactoryIcon,
  ngo: HandHeartIcon,
};

/** Icon for a category slug; categories added later in Sanity get a folder. */
export default function CategoryIcon({ slug, ...props }: { slug: string } & IconProps) {
  const Icon = ICONS[slug] ?? FolderIcon;
  return <Icon {...props} />;
}
