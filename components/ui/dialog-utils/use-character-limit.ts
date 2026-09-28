"use client";

import { useState, type ChangeEvent } from "react";

export interface UseCharacterLimitProps {
  maxLength: number;
  initialValue?: string;
}

export function useCharacterLimit({
  maxLength,
  initialValue = "",
}: UseCharacterLimitProps) {
  const [value, setValue] = useState(initialValue);
  const characterCount = value.length;

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.target.value.length <= maxLength) {
      setValue(e.target.value);
    }
  };

  return {
    value,
    setValue,
    characterCount,
    handleChange,
    maxLength,
  };
}

export default useCharacterLimit;
