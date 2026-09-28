import * as React from "react";
import { cx } from "@/utils/cx";
import { ChevronDown } from "lucide-react";

export interface SelectItem {
  id: string | number;
  label?: string;
  [key: string]: any;
}

export interface SelectProps {
  value?: string | number;
  onChange?: (value: string | number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  items?: SelectItem[];
  children?: ((item: SelectItem) => React.ReactNode) | React.ReactNode;
  "aria-label"?: string;
}

interface SelectComponent extends React.FC<SelectProps> {
  Item: React.FC<{
    id: string | number;
    children: React.ReactNode;
    selectionIndicator?: "none" | "check";
  }>;
}

export const Select: SelectComponent = ({
  value,
  onChange,
  size = "sm",
  className,
  items = [],
  children,
  "aria-label": ariaLabel,
}) => {
  return (
    <div className={cx("relative inline-block", className)}>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          const num = Number(val);
          onChange?.(isNaN(num) ? val : num);
        }}
        className={cx(
          "appearance-none rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 pl-3 pr-7 py-1 text-xs sm:text-sm font-medium shadow-xs outline-none focus:ring-2 focus:ring-[#5E72E4] cursor-pointer"
        )}
      >
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label || item.id}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
    </div>
  );
};

Select.Item = ({ id, children }) => {
  return <option value={id}>{children}</option>;
};
