
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
    if (isOverflowing) {
      setIsTruncated(!isTruncated);
    }
  };

  const lineClampStyle = {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lineClamp,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const canBeExpanded = isOverflowing && isTruncated;
  
  return (
    <p
      ref={textRef}
      onClick={toggleTruncate}
      className={cn(
        'whitespace-pre-wrap',
        canBeExpanded && 'cursor-pointer',
        className
      )}
      style={isTruncated ? lineClampStyle : {}}
      title={canBeExpanded ? "Klik untuk melihat" : ""}
    >
      {text}
    </p>
  );
};

export default TruncatedText;
