import { useCallback, useEffect, useRef, useState } from 'react';

// Shared typing buffer used by both Solo (locked word) and Friends (paragraph).
//
// strict = true  (Friends): cursor cannot advance past an uncorrected wrong
//                          character; you MUST type the expected char.
// strict = false (Solo)   : wrong chars are appended to the buffer and the
//                          user backspaces to clear them.

export function useTypingInput({
  target,
  active,
  strict = false,
  onCorrectChar,
  onWrongChar,
  onComplete,
} = {}) {
  const [buffer, setBuffer] = useState('');
  const [cursorIndex, setCursorIndex] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [errors, setErrors] = useState(0);

  const targetRef = useRef(target);
  const activeRef = useRef(active);
  const strictRef = useRef(strict);
  const onCorrectRef = useRef(onCorrectChar);
  const onWrongRef = useRef(onWrongChar);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { targetRef.current = target; }, [target]);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { strictRef.current = strict; }, [strict]);
  useEffect(() => { onCorrectRef.current = onCorrectChar; }, [onCorrectChar]);
  useEffect(() => { onWrongRef.current = onWrongChar; }, [onWrongChar]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const reset = useCallback(() => {
    setBuffer('');
    setCursorIndex(0);
    setCorrectChars(0);
    setTotalKeystrokes(0);
    setErrors(0);
  }, []);

  // Reset when target changes.
  useEffect(() => {
    setBuffer('');
    setCursorIndex(0);
  }, [target]);

  useEffect(() => {
    function onKey(event) {
      if (!activeRef.current) return;
      const target = targetRef.current;
      if (!target) return;

      // Ignore modifier-only keys + most navigation keys.
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const k = event.key;

      if (k === 'Backspace') {
        event.preventDefault();
        setBuffer((prev) => {
          if (!prev.length) return prev;
          const next = prev.slice(0, -1);
          setCursorIndex(next.length);
          return next;
        });
        return;
      }

      if (k === 'Tab') { event.preventDefault(); return; }
      if (k.length !== 1) return; // ignore F-keys, arrows, shift, etc.

      event.preventDefault();

      setTotalKeystrokes((n) => n + 1);

      if (strictRef.current) {
        // Friends mode: only accept the expected char.
        setBuffer((prev) => {
          const idx = prev.length;
          if (idx >= target.length) return prev;
          const expected = target[idx];
          if (k === expected) {
            const next = prev + k;
            setCursorIndex(next.length);
            setCorrectChars((n) => n + 1);
            onCorrectRef.current?.(next.length, target);
            if (next.length === target.length) onCompleteRef.current?.(next);
            return next;
          }
          setErrors((n) => n + 1);
          onWrongRef.current?.(k, expected);
          return prev;
        });
      } else {
        // Solo mode: append every char; user must backspace mistakes.
        setBuffer((prev) => {
          const next = prev + k;
          setCursorIndex(next.length);
          const isCorrect = target[prev.length] === k;
          if (isCorrect) {
            setCorrectChars((n) => n + 1);
            onCorrectRef.current?.(next.length, target);
            if (next === target) onCompleteRef.current?.(next);
          } else {
            setErrors((n) => n + 1);
            onWrongRef.current?.(k, target[prev.length]);
          }
          return next;
        });
      }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  return {
    buffer,
    cursorIndex,
    correctChars,
    totalKeystrokes,
    errors,
    isComplete: target ? buffer === target : false,
    reset,
  };
}
