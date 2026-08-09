import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(function Button({ className, variant = "primary", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm tracking-wide transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        variant === "primary" &&
          "bg-accent text-accent-contrast hover:opacity-90",
        variant === "secondary" &&
          "border border-fg text-fg hover:bg-fg hover:text-bg",
        variant === "ghost" && "text-fg-muted hover:text-fg",
        className,
      )}
      {...props}
    />
  );
});
