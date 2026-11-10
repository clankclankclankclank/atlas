import React, {useEffect, useRef} from 'react';

const desktopMotion = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';
const nativeCursor = 'input, textarea, select, [contenteditable], dialog, iframe, [draggable=true]';

export function DirectionalCursor({enabled}) {
  const cursor = useRef(null);
  const arrow = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const media = matchMedia(desktopMotion);
    const root = document.documentElement;
    const overlay = cursor.current;
    let frame = 0;
    let last = null;
    let next = null;
    let angle = -28;

    function hide() {
      cancelAnimationFrame(frame);
      frame = 0;
      last = next = null;
      overlay.hidden = true;
      delete root.dataset.directionalCursor;
    }

    function draw() {
      frame = 0;
      const {x, y} = next;
      if (last) {
        const dx = x - last.x;
        const dy = y - last.y;
        if (dx * dx + dy * dy >= 9) {
          const heading = Math.atan2(dy, dx) * 180 / Math.PI;
          angle += ((heading - angle) % 360 + 540) % 360 - 180;
          last = next;
        }
      } else {
        last = next;
        angle = -28;
      }
      arrow.current.style.transform = 'rotate(' + angle + 'deg)';
      overlay.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      overlay.hidden = false;
      root.dataset.directionalCursor = '';
    }

    function move(event) {
      if (!media.matches || event.pointerType !== 'mouse' || event.buttons ||
          event.target.closest?.(nativeCursor)) {
        if (!overlay.hidden || frame) hide();
        return;
      }
      next = {x: event.clientX, y: event.clientY};
      if (!frame) frame = requestAnimationFrame(draw);
    }

    document.addEventListener('pointermove', move, {passive: true});
    document.addEventListener('pointerdown', hide, {passive: true});
    root.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    media.addEventListener('change', hide);
    return () => {
      hide();
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerdown', hide);
      root.removeEventListener('pointerleave', hide);
      window.removeEventListener('blur', hide);
      media.removeEventListener('change', hide);
    };
  }, [enabled]);

  return <div className="atlas-directional-cursor" ref={cursor} aria-hidden="true" hidden>
    <svg ref={arrow} width="18" height="18" viewBox="0 0 18 18">
      <path d="M0 0  -15 -6  -11 0  -15 6Z" fill="currentColor"
        stroke="var(--bg, #111a20)" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  </div>;
}
