import { useEffect, useRef, useState } from 'react';

export const ScrollingText = ({ text, className = '' }: { text?: string; className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const c = containerRef.current;
    const m = measureRef.current;
    if (!c || !m) return;

    const check = () => setOverflow(m.offsetWidth > c.clientWidth + 2);

    check();
    const raf = requestAnimationFrame(check);
    const timer = setTimeout(check, 350);
    const ro = new ResizeObserver(check);
    ro.observe(c);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [text]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden whitespace-nowrap ${className}`}>
      <span ref={measureRef} className="invisible absolute left-0 top-0 inline-block" aria-hidden>{text}</span>
      {overflow ? (
        <span className="ns-marquee">
          <span className="pr-12">{text}</span>
          <span className="pr-12">{text}</span>
        </span>
      ) : (
        <span className="block overflow-hidden text-ellipsis">{text}</span>
      )}
    </div>
  );
};
