// src/hooks/useSwipeGesture.js
import { useState, useRef, useCallback } from 'react';

export const useSwipeGesture = ({ onSwipeLeft, onSwipeRight }) => {
  const touchStart = useRef(null);
  const touchEnd = useRef(null);
  const [touchDistance, setTouchDistance] = useState(0);

  const handleTouchStart = useCallback((e) => {
    touchStart.current = e.touches[0].clientX;
    touchEnd.current = null;
  }, []);

  const handleTouchMove = useCallback((e) => {
    touchEnd.current = e.touches[0].clientX;
    const distance = touchEnd.current - touchStart.current;
    setTouchDistance(distance);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;

    const distance = touchEnd.current - touchStart.current;
    const isLeftSwipe = distance < -0.4 * window.innerWidth;
    const isRightSwipe = distance > 0.4 * window.innerWidth;

    if (isLeftSwipe) {
      onSwipeLeft?.();
    } else if (isRightSwipe) {
      onSwipeRight?.();
    }

    setTouchDistance(0);
    touchStart.current = null;
    touchEnd.current = null;
  }, [onSwipeLeft, onSwipeRight]);

  return {
    touchDistance,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};