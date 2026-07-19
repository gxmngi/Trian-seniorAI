import { useEffect } from "react";

interface KeyboardShortcutsProps {
  zoomIn: () => void;
  zoomOut: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  copy?: () => void;
  paste?: () => void;
}

export function useKeyboardShortcuts({
  zoomIn,
  zoomOut,
  undo,
  redo,
  canUndo,
  canRedo,
  copy,
  paste,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts while typing in input, textarea, or editable content
      const target = e.target as HTMLElement;
      if (
        !target ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      // Zoom In: '+' or '='
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomIn();
      }
      // Zoom Out: '-'
      else if (e.key === "-") {
        e.preventDefault();
        zoomOut();
      }
      // Undo: Cmd/Ctrl + Z
      else if (isCmdOrCtrl && e.key?.toLowerCase() === "z" && !isShift) {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
      }
      // Redo: Cmd/Ctrl + Shift + Z
      else if (isCmdOrCtrl && e.key?.toLowerCase() === "z" && isShift) {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
      }
      // Redo: Cmd/Ctrl + Y
      else if (isCmdOrCtrl && e.key?.toLowerCase() === "y") {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
      }
      // Copy: Cmd/Ctrl + C
      else if (isCmdOrCtrl && e.key?.toLowerCase() === "c") {
        if (copy) {
          e.preventDefault();
          copy();
        }
      }
      // Paste: Cmd/Ctrl + V
      else if (isCmdOrCtrl && e.key?.toLowerCase() === "v") {
        if (paste) {
          e.preventDefault();
          paste();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [zoomIn, zoomOut, undo, redo, canUndo, canRedo, copy, paste]);
}

