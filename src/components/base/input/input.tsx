import * as React from "react";
import { cx } from "@/utils/cx";

export interface InputBaseProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "sm" | "md" | "lg";
  wrapperClassName?: string;
  inputClassName?: string;
}

export const InputBase = React.forwardRef<HTMLInputElement, InputBaseProps>(
  (
    {
      className,
      wrapperClassName,
      inputClassName,
      size = "sm",
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={cx(
          "inline-flex items-center rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-xs focus-within:ring-2 focus-within:ring-[#5E72E4] focus-within:border-transparent transition-all",
          wrapperClassName
        )}
      >
        <input
          ref={ref}
          className={cx(
            "w-full bg-transparent px-2.5 py-1 text-xs sm:text-sm font-medium text-neutral-900 dark:text-white outline-none placeholder:text-neutral-400",
            inputClassName,
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

InputBase.displayName = "InputBase";
