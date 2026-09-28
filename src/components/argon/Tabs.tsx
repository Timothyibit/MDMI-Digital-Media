import React from 'react';
import { argonTheme } from '../../constants/Theme';

export interface ArgonTabItem {
  id: string;
  title: string;
}

export interface ArgonTabsProps {
  data: ArgonTabItem[];
  activeTab?: string;
  onChange?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ArTabs: React.FC<ArgonTabsProps> = ({
  data,
  activeTab,
  onChange,
  className = '',
  style,
}) => {
  return (
    <div
      className={`w-full overflow-x-auto no-scrollbar py-2 flex items-center gap-2 select-none ${className}`}
      style={style}
    >
      {data.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange?.(item.id)}
            className={`cursor-pointer whitespace-nowrap px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              isActive
                ? 'bg-[#5E72E4] text-white shadow-[0_4px_6px_rgba(50,50,93,0.11),0_1px_3px_rgba(0,0,0,0.08)]'
                : 'bg-[#F7FAFC] dark:bg-neutral-800 text-[#525F7F] dark:text-neutral-300 hover:bg-[#edf2f7] dark:hover:bg-neutral-700'
            }`}
          >
            {item.title}
          </button>
        );
      })}
    </div>
  );
};

export const Tabs = ArTabs;
export default Tabs;
