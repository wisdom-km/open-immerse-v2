import { useEffect, useRef, useState } from "react";

export function useFileDrop(onFile: (file: File) => void): boolean {
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  useEffect(() => {
    return bindDrop(onFile, setOver, depth);
  }, [onFile]);
  return over;
}

function bindDrop(
  onFile: (file: File) => void,
  setOver: (over: boolean) => void,
  depth: { current: number },
): () => void {
  function enter(event: DragEvent): void {
    event.preventDefault();
    depth.current += 1;
    setOver(true);
  }
  function over(event: DragEvent): void {
    event.preventDefault();
  }
  function leave(): void {
    depth.current -= 1;
    if (depth.current <= 0) {
      depth.current = 0;
      setOver(false);
    }
  }
  function drop(event: DragEvent): void {
    event.preventDefault();
    depth.current = 0;
    setOver(false);
    const file = event.dataTransfer?.files[0];
    if (file !== undefined) {
      onFile(file);
    }
  }
  window.addEventListener("dragenter", enter);
  window.addEventListener("dragover", over);
  window.addEventListener("dragleave", leave);
  window.addEventListener("drop", drop);
  return () => {
    window.removeEventListener("dragenter", enter);
    window.removeEventListener("dragover", over);
    window.removeEventListener("dragleave", leave);
    window.removeEventListener("drop", drop);
  };
}
