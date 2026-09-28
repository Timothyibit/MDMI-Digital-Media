declare module 'react-native' {
  import React from 'react';

  export interface ViewProps {
    className?: string;
    id?: string;
    style?: any;
    children?: React.ReactNode;
  }
  export const View: React.FC<ViewProps>;

  export interface TextProps {
    className?: string;
    id?: string;
    style?: any;
    numberOfLines?: number;
    children?: React.ReactNode;
  }
  export const Text: React.FC<TextProps>;

  export interface TouchableOpacityProps {
    className?: string;
    id?: string;
    style?: any;
    onPress?: (e?: any) => void;
    accessibilityLabel?: string;
    disabled?: boolean;
    children?: React.ReactNode;
  }
  export const TouchableOpacity: React.FC<TouchableOpacityProps>;
  export const Pressable: React.FC<TouchableOpacityProps>;

  export interface ScrollViewProps {
    className?: string;
    id?: string;
    style?: any;
    contentContainerStyle?: any;
    showsVerticalScrollIndicator?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    horizontal?: boolean;
    onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
    scrollEventThrottle?: number;
    children?: React.ReactNode;
  }
  export const ScrollView: React.FC<ScrollViewProps>;

  export interface FlatListProps<T> {
    className?: string;
    id?: string;
    style?: any;
    data: T[];
    keyExtractor: (item: T, index: number) => string;
    renderItem: (info: { item: T; index: number }) => React.ReactElement | null;
    showsVerticalScrollIndicator?: boolean;
    contentContainerStyle?: any;
    ListEmptyComponent?: React.ReactNode;
  }
  export function FlatList<T>(props: FlatListProps<T>): React.ReactElement;

  export interface TextInputProps {
    className?: string;
    id?: string;
    style?: any;
    placeholder?: string;
    placeholderTextColor?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    multiline?: boolean;
    numberOfLines?: number;
    secureTextEntry?: boolean;
    autoCapitalize?: string;
  }
  export const TextInput: React.FC<TextInputProps>;

  export interface SwitchProps {
    className?: string;
    id?: string;
    style?: any;
    value?: boolean;
    onValueChange?: (val: boolean) => void;
    trackColor?: { false?: string; true?: string };
    thumbColor?: string;
  }
  export const Switch: React.FC<SwitchProps>;

  export const SafeAreaView: React.FC<ViewProps>;

  export interface NativeSyntheticEvent<T> {
    nativeEvent: T;
  }

  export interface NativeScrollEvent {
    contentOffset: { x: number; y: number };
    contentSize: { width: number; height: number };
    layoutMeasurement: { width: number; height: number };
  }
}
