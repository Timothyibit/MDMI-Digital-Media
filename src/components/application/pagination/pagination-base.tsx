import * as React from "react";
import { cx } from "@/utils/cx";

export type PageToken =
  | { type: "page"; value: number; isCurrent: boolean }
  | { type: "ellipsis" };

export function generatePaginationTokens(
  currentPage: number,
  totalPages: number
): PageToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => ({
      type: "page" as const,
      value: i + 1,
      isCurrent: i + 1 === currentPage,
    }));
  }

  const tokens: PageToken[] = [];
  tokens.push({ type: "page", value: 1, isCurrent: currentPage === 1 });

  if (currentPage > 3) {
    tokens.push({ type: "ellipsis" });
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    tokens.push({ type: "page", value: i, isCurrent: currentPage === i });
  }

  if (currentPage < totalPages - 2) {
    tokens.push({ type: "ellipsis" });
  }

  tokens.push({
    type: "page",
    value: totalPages,
    isCurrent: currentPage === totalPages,
  });

  return tokens;
}

interface PaginationContextValue {
  currentPage: number;
  total: number;
  setPage: (page: number) => void;
  pages: PageToken[];
}

const PaginationContext = React.createContext<PaginationContextValue | undefined>(
  undefined
);

export function usePaginationContext() {
  const ctx = React.useContext(PaginationContext);
  if (!ctx) {
    throw new Error("Pagination components must be used within a Pagination.Root");
  }
  return ctx;
}

export interface PaginationRootProps {
  page?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  className?: string;
  children?: React.ReactNode;
  asChild?: boolean;
}

const PaginationRoot: React.FC<PaginationRootProps> = ({
  page = 1,
  total = 1,
  onPageChange,
  className,
  children,
}) => {
  const safePage = Math.max(1, Math.min(page, Math.max(1, total)));
  const pages = React.useMemo(
    () => generatePaginationTokens(safePage, Math.max(1, total)),
    [safePage, total]
  );

  const setPage = React.useCallback(
    (nextPage: number) => {
      const clamped = Math.max(1, Math.min(nextPage, Math.max(1, total)));
      if (clamped !== safePage) {
        onPageChange?.(clamped);
      }
    },
    [safePage, total, onPageChange]
  );

  const value = React.useMemo(
    () => ({
      currentPage: safePage,
      total: Math.max(1, total),
      setPage,
      pages,
    }),
    [safePage, total, setPage, pages]
  );

  return (
    <PaginationContext.Provider value={value}>
      <nav aria-label="Pagination Navigation" className={cx("flex items-center", className)}>
        {children}
      </nav>
    </PaginationContext.Provider>
  );
};

export interface PaginationContextProps {
  children: (context: {
    pages: PageToken[];
    currentPage: number;
    total: number;
  }) => React.ReactNode;
}

const ContextRender: React.FC<PaginationContextProps> = ({ children }) => {
  const { pages, currentPage, total } = usePaginationContext();
  return <>{children({ pages, currentPage, total })}</>;
};

export interface PaginationItemProps {
  value: number;
  isCurrent?: boolean;
  className?: string | ((state: { isSelected: boolean }) => string);
  children?: React.ReactNode;
  asChild?: boolean;
}

const PaginationItem: React.FC<PaginationItemProps> = ({
  value,
  isCurrent = false,
  className,
  children,
  asChild = false,
}) => {
  const { setPage } = usePaginationContext();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setPage(value);
  };

  const computedClass =
    typeof className === "function" ? className({ isSelected: isCurrent }) : className;

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
      "aria-current": isCurrent ? "page" : undefined,
      isSelected: isCurrent,
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-current={isCurrent ? "page" : undefined}
      className={cx(
        "flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer",
        isCurrent
          ? "bg-[#5E72E4] text-white shadow-xs font-bold"
          : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
        computedClass
      )}
    >
      {children !== undefined ? children : value}
    </button>
  );
};

export interface PaginationEllipsisProps extends React.HTMLAttributes<HTMLSpanElement> {}

const PaginationEllipsis: React.FC<PaginationEllipsisProps> = ({
  className,
  children = "…",
  ...props
}) => {
  return (
    <span
      className={cx(
        "flex size-9 shrink-0 items-center justify-center text-sm font-medium text-neutral-400 select-none",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export interface PaginationTriggerProps {
  asChild?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const PaginationPrevTrigger: React.FC<PaginationTriggerProps> = ({
  asChild,
  className,
  children,
}) => {
  const { currentPage, setPage } = usePaginationContext();
  const isDisabled = currentPage <= 1;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isDisabled) {
      setPage(currentPage - 1);
    }
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
      disabled: isDisabled,
      isDisabled: isDisabled,
      className: cx((children.props as any).className, className),
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label="Previous Page"
      className={cx(
        "px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
        className
      )}
    >
      {children || "Previous"}
    </button>
  );
};

const PaginationNextTrigger: React.FC<PaginationTriggerProps> = ({
  asChild,
  className,
  children,
}) => {
  const { currentPage, total, setPage } = usePaginationContext();
  const isDisabled = currentPage >= total;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isDisabled) {
      setPage(currentPage + 1);
    }
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
      disabled: isDisabled,
      isDisabled: isDisabled,
      className: cx((children.props as any).className, className),
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label="Next Page"
      className={cx(
        "px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
        className
      )}
    >
      {children || "Next"}
    </button>
  );
};

export const Pagination = {
  Root: PaginationRoot,
  Context: ContextRender,
  Item: PaginationItem,
  Ellipsis: PaginationEllipsis,
  PrevTrigger: PaginationPrevTrigger,
  NextTrigger: PaginationNextTrigger,
};
