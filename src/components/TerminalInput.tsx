import React, { useContext, useEffect, useRef, useState } from 'react';

interface TerminalInputProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    inputRef: React.RefObject<HTMLInputElement>;
  }
  
  const TerminalInput = ({ value, onChange, onKeyDown, inputRef }: TerminalInputProps) =>
  (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        autoComplete="off" // Google's incompetent Chrome authors broke this TEN YEARS AGO and refuse to fix it; works in all browsers EXCEPT chrome
      />
);

export default TerminalInput;