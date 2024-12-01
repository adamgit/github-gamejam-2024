// components/Notes.js
import React, { useState, useRef } from 'react';
import { Rnd } from 'react-rnd';
import './Notes.css';

const Notes = ({ id, onClose, windowManager }) => {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Acquire focus for the notes window
  const acquireFocus = () => {
    windowManager.acquireFocus({
      id,
      onFocus: handleFocus,
      onBlur: handleBlur,
    });
  };

  // Handle focus
  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    setIsFocused(true);
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <Rnd
      default={{
        x: 100,
        y: 100,
        width: 400,
        height: 300,
      }}
      minWidth={300}
      minHeight={200}
      bounds="window"
      dragHandleClassName="notes-header"
      onDragStart={() => windowManager.handleInteraction({ id, onFocus: handleFocus, onBlur: handleBlur })}
      onResizeStart={() => windowManager.handleInteraction({ id, onFocus: handleFocus, onBlur: handleBlur })}
    >
      <div className="notes-window">
        <div
          className="notes-header"
          onClick={acquireFocus}
          style={windowManager.getTitleBarStyle('Notes', isFocused)}
        >
          <span>Notes</span>
          <button onClick={() => onClose(id)}>X</button>
        </div>
        <div className="notes-body">
          <textarea ref={inputRef} className="notes-input" />
        </div>
      </div>
    </Rnd>
  );
};

export default Notes;
