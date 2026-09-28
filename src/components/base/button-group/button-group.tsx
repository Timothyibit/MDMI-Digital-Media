import * as React from "react";
import { cx } from "@/utils/cx";

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      role="group"
      className={cx(
        "inline-flex items-center rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-xs overflow-hidden divide-x divide-neutral-200 dark:divide-neutral-700",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export interface ButtonGroupItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isSelected?: boolean;
  iconLeading?: React.ComponentType<{ className?: string }>;
  iconTrailing?: React.ComponentType<{ className?: string }>;
}

export const ButtonGroupItem = React.forwardRef<
  HTMLButtonElement,
  ButtonGroupItemProps
>(
  (
    {
      className,
      isSelected = false,
      iconLeading: IconLeading,
      iconTrailing: IconTrailing,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cx(
          "inline-flex items-center justify-center text-xs font-semibold px-3 py-2 transition-colors select-none outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[#5E72E4]",
          isSelected
            ? "bg-[#5E72E4] text-white"
            : "text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/60",
          className
        )}
        {...props}
      >
        {IconLeading && <IconLeading className="w-4 h-4 mr-1 shrink-0" />}
        {children}
        {IconTrailing && <IconTrailing className="w-4 h-4 ml-1 shrink-0" />}
      </button>
    );
  }
);

ButtonGroupItem.displayName = "ButtonGroupItem";
