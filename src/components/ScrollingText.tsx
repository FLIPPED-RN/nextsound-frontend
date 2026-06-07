import { useEffect, useRef, useState } from 'react';

export const ScrollingText = ({ text, className = '' }: { text?: string; className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const check = () => {
      const c = containerRef.current;
      const t = textRef.current;
      if (!c || !t) return;
      setOverflow(t.scrollWidth > c.clientWidth + 2);
    };
    check();
    const id = setTimeout(check, 300);
    window.addEventListener('resize', check);
    return () => { clearTimeout(id); window.removeEventListener('resize', check); };
  }, [text]);

  return (
    <div ref={containerRef} className={`overflow-hidden whitespace-nowrap ${className}`}>
      <div className={overflow ? 'ns-marquee' : 'inline-block max-w-full truncate align-bottom'}>
        <span ref={textRef} className={overflow ? 'pr-12' : ''}>{text}</span>
        {overflow && <span className="pr-12">{text}</span>}
      </div>
    </div>
  );
};
