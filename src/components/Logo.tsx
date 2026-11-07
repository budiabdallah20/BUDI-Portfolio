import { cn } from "@/lib/utils";
import { BUDI_WORDMARK_PATH, BUDI_MARK_PATH } from "@/lib/brand";
type LogoVariant = "mark" | "full" | "stacked";
export default function Logo({ variant = "mark", className, tile = false }: { variant?: LogoVariant; className?: string; tile?: boolean }): React.JSX.Element {
 const stacked = variant === "stacked";
 return <span className={cn("inline-flex items-center justify-center", tile && "rounded-[22%] bg-white p-[9%]", className)}>
  <svg viewBox={variant === "mark" ? "0 0 58 84" : stacked ? "0 0 160 184" : "0 0 114 72"} role="img" aria-label="BUDI logo" className="block h-full w-full" fill={tile || stacked ? "#0a0a0a" : "currentColor"}>
   {variant === "mark" ? <path fillRule="evenodd" d={BUDI_MARK_PATH}/> : stacked ? <><path fillRule="evenodd" d={BUDI_MARK_PATH} transform="translate(51 0)"/><path fillRule="evenodd" d={BUDI_WORDMARK_PATH} transform="translate(4 89) scale(1.35)"/></> : <path fillRule="evenodd" d={BUDI_WORDMARK_PATH}/>}
  </svg>
 </span>;
}
