import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  Brain,
  Cloud,
  Code2,
  Cpu,
  Database,
  Gauge,
  GitBranch,
  Globe,
  Layers,
  Lock,
  MessagesSquare,
  Palette,
  PenTool,
  Rocket,
  Search,
  Server,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Terminal,
  Wrench,
  Zap,
} from "lucide-react";

/**
 * Curated library-icon set shared by the dashboard pickers and the live
 * site. A service/skill stores one key (e.g. "Rocket"); both sides resolve
 * it through libIcon() so the dashboard preview and the site card can
 * never disagree. Unknown keys → null → caller falls back to image/initial.
 */
export const LIB_ICONS: Record<string, LucideIcon> = {
  Code2,
  Globe,
  Palette,
  Server,
  Database,
  ShieldCheck,
  Gauge,
  Smartphone,
  Cloud,
  GitBranch,
  Cpu,
  Wrench,
  Rocket,
  Layers,
  Zap,
  Lock,
  Search,
  BarChart3,
  ShoppingCart,
  MessagesSquare,
  Terminal,
  Boxes,
  Brain,
  PenTool,
  Settings,
};

export const LIB_ICON_CHOICES: { name: string; label: string }[] = [
  { name: "Code2", label: "Code" },
  { name: "Globe", label: "Web" },
  { name: "Palette", label: "Design" },
  { name: "PenTool", label: "UI craft" },
  { name: "Server", label: "Server" },
  { name: "Database", label: "Data" },
  { name: "Cloud", label: "Cloud" },
  { name: "Smartphone", label: "Mobile" },
  { name: "ShieldCheck", label: "Security" },
  { name: "Lock", label: "Privacy" },
  { name: "Zap", label: "Speed" },
  { name: "Gauge", label: "Performance" },
  { name: "Search", label: "SEO" },
  { name: "BarChart3", label: "Analytics" },
  { name: "ShoppingCart", label: "Store" },
  { name: "MessagesSquare", label: "Chat" },
  { name: "GitBranch", label: "DevOps" },
  { name: "Terminal", label: "CLI" },
  { name: "Boxes", label: "Systems" },
  { name: "Layers", label: "Stack" },
  { name: "Cpu", label: "AI / chip" },
  { name: "Brain", label: "AI mind" },
  { name: "Rocket", label: "Launch" },
  { name: "Wrench", label: "Support" },
  { name: "Settings", label: "Config" },
];

export function libIcon(name: string | undefined | null): LucideIcon | null {
  if (!name) return null;
  return LIB_ICONS[name] ?? null;
}
