import * as React from "react";
import { cx } from "@/utils/cx";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: "primary" | "secondary" | "link-gray" | "tertiary";
  size?: "sm" | "md" | "lg";
  iconLeading?: React.ComponentType<{ className?: string }>;
  iconTrailing?: React.ComponentType<{ className?: string }>;
  isDisabled?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      color = "secondary",
      size = "sm",
      iconLeading: IconLeading,
      iconTrailing: IconTrailing,
      isDisabled = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isActuallyDisabled = isDisabled || disabled;

    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4] cursor-pointer disabled:pointer-events-none disabled:opacity-40";

    const sizeStyles = {
      sm: "h-9 px-3 py-1.5 text-xs sm:text-sm rounded-lg gap-1.5",
      md: "h-10 px-4 py-2 text-sm rounded-xl gap-2",
      lg: "h-11 px-5 py-2.5 text-base rounded-xl gap-2.5",
    }[size];

    const colorStyles = {
      primary: "bg-[#5E72E4] text-white hover:bg-[#485ec4] shadow-sm border border-transparent",
      secondary:
        "border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/80 shadow-xs",
      "link-gray":
        "border border-transparent bg-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800",
      tertiary:
        "border border-transparent bg-transparent text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
    }[color];

    return (
      <button
        ref={ref}
        type="button"
        disabled={isActuallyDisabled}
        className={cx(baseStyles, sizeStyles, colorStyles, className)}
        {...props}
      >
        {IconLeading && <IconLeading className="w-4 h-4 shrink-0" />}
        {children}
        {IconTrailing && <IconTrailing className="w-4 h-4 shrink-0" />}
      </button>
    );
  }
);

Button.displayName = "Button";
