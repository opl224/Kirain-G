
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface TruncatedTextProps {
  text: string;
  lineClamp?: number;
  className?: string;
}

const TruncatedText = ({ text, lineClamp = 2, className }: TruncatedTextProps) => {
  const [isTruncated, setIsTruncated] = useState(true);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  const checkOverflow = useCallback(() => {
    const element = textRef.current;
    if (element) {
      // Check if the content is taller than its container
      const isClamped = element.scrollHeight > element.clientHeight;
      setIsOverflowing(isClamped);
    }
  }, []);

  useEffect(() => {
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [checkOverflow, text]);

  const toggleTruncate = () => {
    setIsTruncated(!isTruncated);
  };

  const lineClampStyle = {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lineClamp,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
  
  return (
    <div>
      <p
        ref={textRef}
        className={cn(className)}
        style={isTruncated ? lineClampStyle : undefined}
      >
        {text}
      </p>
      {isOverflowing && isTruncated && (
        <button
          onClick={toggleTruncate}
          className="text-sm text-primary hover:underline mt-1"
        >
          lihat selengkapnya...
        </button>
      )}
    </div>
  );
};

export default TruncatedText;
