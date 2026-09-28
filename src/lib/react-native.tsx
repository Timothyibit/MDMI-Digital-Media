import React from 'react';

/**
 * Normalizes React Native style attributes (e.g. paddingHorizontal, paddingVertical,
 * marginHorizontal, marginVertical) into standard Web CSS properties to prevent React warnings
 * and ensure visual fidelity.
 */
export function normalizeStyle(styleObj?: React.CSSProperties | Record<string, any>): React.CSSProperties | undefined {
  if (!styleObj) return undefined;
  const normalized: Record<string, any> = { ...styleObj };

  if ('paddingHorizontal' in normalized) {
    const val = normalized.paddingHorizontal;
    delete normalized.paddingHorizontal;
    if (normalized.paddingLeft === undefined) normalized.paddingLeft = val;
    if (normalized.paddingRight === undefined) normalized.paddingRight = val;
  }
  if ('paddingVertical' in normalized) {
    const val = normalized.paddingVertical;
    delete normalized.paddingVertical;
    if (normalized.paddingTop === undefined) normalized.paddingTop = val;
    if (normalized.paddingBottom === undefined) normalized.paddingBottom = val;
  }
  if ('marginHorizontal' in normalized) {
    const val = normalized.marginHorizontal;
    delete normalized.marginHorizontal;
    if (normalized.marginLeft === undefined) normalized.marginLeft = val;
    if (normalized.marginRight === undefined) normalized.marginRight = val;
  }
  if ('marginVertical' in normalized) {
    const val = normalized.marginVertical;
    delete normalized.marginVertical;
    if (normalized.marginTop === undefined) normalized.marginTop = val;
    if (normalized.marginBottom === undefined) normalized.marginBottom = val;
  }

  return normalized as React.CSSProperties;
}

/**
 * Ensures View defaults to flex column without conflicting with responsive display classes
 * like 'hidden md:flex-row' or explicit 'flex-row' / 'grid' definitions.
 */
function resolveViewClass(className: string): string {
  if (!className) return 'flex flex-col';
  const tokens = className.trim().split(/\s+/);
  const hasHidden = tokens.some((t) => t === 'hidden');
  const hasDisplay = tokens.some((t) => ['flex', 'grid', 'block', 'inline', 'inline-flex', 'inline-block'].includes(t));
  const hasDirection = tokens.some((t) => ['flex-row', 'flex-col', 'flex-row-reverse', 'flex-col-reverse'].includes(t));

  const extra: string[] = [];
  if (!hasHidden && !hasDisplay) {
    extra.push('flex');
  }
  if (!hasDirection && !tokens.some((t) => t.includes('grid') || t.includes('flex-row'))) {
    extra.push('flex-col');
  }

  return extra.length > 0 ? `${extra.join(' ')} ${className}` : className;
}

export interface ViewProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  style?: React.CSSProperties;
  accessibilityLabel?: string;
  children?: React.ReactNode;
}

export const View: React.FC<ViewProps> = ({
  className = '',
  style,
  accessibilityLabel,
  children,
  ...props
}) => (
  <div
    className={resolveViewClass(className)}
    style={normalizeStyle(style)}
    aria-label={accessibilityLabel || (props as any)['aria-label']}
    {...props}
  >
    {children}
  </div>
);

export const SafeAreaView: React.FC<ViewProps> = ({
  className = '',
  style,
  accessibilityLabel,
  children,
  ...props
}) => (
  <div
    className={`min-h-screen flex flex-col ${className}`}
    style={normalizeStyle(style)}
    aria-label={accessibilityLabel || (props as any)['aria-label']}
    {...props}
  >
    {children}
  </div>
);

export interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
  style?: React.CSSProperties;
  numberOfLines?: number;
  accessibilityLabel?: string;
  children?: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  className = '',
  style,
  numberOfLines,
  accessibilityLabel,
  children,
  ...props
}) => {
  const lineClampStyle: React.CSSProperties = numberOfLines
    ? {
        display: '-webkit-box',
        WebkitLineClamp: numberOfLines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }
    : {};

  return (
    <span
      className={`inline-block ${className}`}
      style={{ ...lineClampStyle, ...normalizeStyle(style) }}
      aria-label={accessibilityLabel || (props as any)['aria-label']}
      {...props}
    >
      {children}
    </span>
  );
};

export interface TouchableOpacityProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  className?: string;
  style?: React.CSSProperties;
  onPress?: (e?: any) => void;
  onClick?: (e?: any) => void;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  accessibilityHint?: string;
  activeOpacity?: number;
  testID?: string;
  children?: React.ReactNode;
}

export const TouchableOpacity: React.FC<TouchableOpacityProps> = ({
  className = '',
  style,
  onPress,
  onClick,
  accessibilityLabel,
  accessibilityRole,
  accessibilityHint,
  activeOpacity,
  testID,
  children,
  disabled,
  ...props
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={(e) => {
      onPress?.(e);
      onClick?.(e);
    }}
    aria-label={accessibilityLabel || (props as any)['aria-label']}
    role={accessibilityRole || props.role}
    data-testid={testID}
    className={`cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    style={normalizeStyle(style)}
    {...props}
  >
    {children}
  </button>
);

export const Pressable = TouchableOpacity;

export interface ScrollViewProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onScroll'> {
  className?: string;
  style?: React.CSSProperties;
  contentContainerStyle?: React.CSSProperties;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  horizontal?: boolean;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
  keyboardShouldPersistTaps?: string;
  bounces?: boolean;
  children?: React.ReactNode;
}

export const ScrollView: React.FC<ScrollViewProps> = ({
  className = '',
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator,
  showsHorizontalScrollIndicator,
  horizontal,
  onScroll,
  scrollEventThrottle,
  keyboardShouldPersistTaps,
  bounces,
  children,
  ...props
}) => {
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!onScroll) return;
    const target = e.currentTarget;
    const synthEvent: NativeSyntheticEvent<NativeScrollEvent> = {
      nativeEvent: {
        contentOffset: { x: target.scrollLeft, y: target.scrollTop },
        contentSize: { width: target.scrollWidth, height: target.scrollHeight },
        layoutMeasurement: { width: target.clientWidth, height: target.clientHeight },
      },
    };
    onScroll(synthEvent);
  };

  return (
    <div
      className={`overflow-auto ${horizontal ? 'flex flex-row overflow-x-auto' : 'overflow-y-auto flex flex-col'} ${className}`}
      style={{ ...normalizeStyle(style), ...normalizeStyle(contentContainerStyle) }}
      onScroll={handleScroll}
      {...props}
    >
      {children}
    </div>
  );
};

export interface FlatListProps<T> {
  className?: string;
  style?: React.CSSProperties;
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (info: { item: T; index: number }) => React.ReactElement | null;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  contentContainerStyle?: React.CSSProperties;
  ListEmptyComponent?: React.ReactNode;
  ListHeaderComponent?: React.ReactNode;
  ListFooterComponent?: React.ReactNode;
  horizontal?: boolean;
  scrollEventThrottle?: number;
  keyboardShouldPersistTaps?: string;
  bounces?: boolean;
}

export function FlatList<T>({
  className = '',
  style,
  data,
  keyExtractor,
  renderItem,
  showsVerticalScrollIndicator,
  showsHorizontalScrollIndicator,
  contentContainerStyle,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  horizontal,
  scrollEventThrottle,
  keyboardShouldPersistTaps,
  bounces,
  ...props
}: FlatListProps<T> & Record<string, any>): React.ReactElement {
  if (!data || data.length === 0) {
    return (
      <div
        className={`flex flex-col ${className}`}
        style={{ ...normalizeStyle(style), ...normalizeStyle(contentContainerStyle) }}
        {...props}
      >
        {ListHeaderComponent || null}
        {ListEmptyComponent || null}
        {ListFooterComponent || null}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col ${className}`}
      style={{ ...normalizeStyle(style), ...normalizeStyle(contentContainerStyle) }}
      {...props}
    >
      {ListHeaderComponent || null}
      {data.map((item, index) => (
        <React.Fragment key={keyExtractor ? keyExtractor(item, index) : index}>
          {renderItem({ item, index })}
        </React.Fragment>
      ))}
      {ListFooterComponent || null}
    </div>
  );
}

export interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, 'value' | 'onChange' | 'autoCorrect'> {
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  placeholderTextColor?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onChange?: (e: any) => void;
  multiline?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
  accessibilityLabel?: string;
  autoCapitalize?: string;
  autoCorrect?: boolean;
  keyboardType?: string;
  returnKeyType?: string;
  blurOnSubmit?: boolean;
  onSubmitEditing?: () => void;
  clearButtonMode?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  className = '',
  style,
  value,
  onChangeText,
  onChange,
  multiline,
  numberOfLines = 3,
  secureTextEntry,
  placeholder,
  placeholderTextColor,
  accessibilityLabel,
  autoCapitalize,
  autoCorrect,
  keyboardType,
  returnKeyType,
  blurOnSubmit,
  onSubmitEditing,
  clearButtonMode,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChangeText?.(e.target.value);
    onChange?.(e);
  };

  if (multiline) {
    return (
      <textarea
        value={value}
        rows={numberOfLines}
        placeholder={placeholder}
        onChange={handleChange}
        aria-label={accessibilityLabel || (props as any)['aria-label']}
        className={`w-full outline-none resize-none ${className}`}
        style={normalizeStyle(style)}
        {...(props as any)}
      />
    );
  }

  return (
    <input
      type={secureTextEntry ? 'password' : 'text'}
      value={value}
      placeholder={placeholder}
      onChange={handleChange}
      aria-label={accessibilityLabel || (props as any)['aria-label']}
      className={`w-full outline-none ${className}`}
      style={normalizeStyle(style)}
      {...(props as any)}
    />
  );
};

export interface SwitchProps {
  className?: string;
  style?: React.CSSProperties;
  value?: boolean;
  onValueChange?: (val: boolean) => void;
  accessibilityLabel?: string;
  trackColor?: { false?: string; true?: string };
  thumbColor?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  value = false,
  onValueChange,
  accessibilityLabel = 'Toggle setting',
  className = '',
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={value}
    aria-label={accessibilityLabel}
    onClick={() => onValueChange?.(!value)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
      value ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
    } ${className}`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
        value ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export const Platform = {
  OS: 'web',
  select: (obj: any) => obj.web || obj.default,
};

export const Dimensions = {
  get: () => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 375,
    height: typeof window !== 'undefined' ? window.innerHeight : 812,
  }),
};

export const StyleSheet = {
  create: (styles: any) => styles,
};

export const Alert = {
  alert: (title: string, message?: string) => {
    if (typeof window !== 'undefined') {
      console.log(`[Alert] ${title}: ${message || ''}`);
    }
  },
};

export type NativeSyntheticEvent<T> = {
  nativeEvent: T;
};

export type NativeScrollEvent = {
  contentOffset: { x: number; y: number };
  contentSize: { width: number; height: number };
  layoutMeasurement: { width: number; height: number };
};

// Re-export MDMI UI Design System Components
export * from '../components/argon';

