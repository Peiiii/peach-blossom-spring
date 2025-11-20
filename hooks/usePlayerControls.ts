
import { useState, useEffect } from 'react';

export const usePlayerControls = () => {
  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    descend: false,
    flyMode: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: any) => {
      // Toggle Fly Mode on 'F'
      if (e.code === 'KeyF' && !e.repeat) {
        setMovement((m) => ({ ...m, flyMode: !m.flyMode }));
        return;
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setMovement((m) => ({ ...m, forward: true }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setMovement((m) => ({ ...m, backward: true }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setMovement((m) => ({ ...m, left: true }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setMovement((m) => ({ ...m, right: true }));
          break;
        case 'Space':
          setMovement((m) => ({ ...m, jump: true }));
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          setMovement((m) => ({ ...m, descend: true }));
          break;
      }
    };

    const handleKeyUp = (e: any) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setMovement((m) => ({ ...m, forward: false }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setMovement((m) => ({ ...m, backward: false }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setMovement((m) => ({ ...m, left: false }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setMovement((m) => ({ ...m, right: false }));
          break;
        case 'Space':
          setMovement((m) => ({ ...m, jump: false }));
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          setMovement((m) => ({ ...m, descend: false }));
          break;
      }
    };

    (window as any).document.addEventListener('keydown', handleKeyDown);
    (window as any).document.addEventListener('keyup', handleKeyUp);

    return () => {
      (window as any).document.removeEventListener('keydown', handleKeyDown);
      (window as any).document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return movement;
};