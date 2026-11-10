import React, {useLayoutEffect, useRef} from 'react';

export default function RubberSegment({items, value, onChange, label}) {
  const track = useRef(null);
  const thumb = useRef(null);
  const selected = useRef(null);

  useLayoutEffect(() => {
    const rail = track.current;
    const button = selected.current;
    const indicator = thumb.current;
    if (!button) {
      delete rail.dataset.ready;
      return;
    }

    function placeThumb() {
      indicator.style.width = button.offsetWidth + 'px';
      indicator.style.height = button.offsetHeight + 'px';
      indicator.style.transform = 'translate(' + button.offsetLeft + 'px,' + button.offsetTop + 'px)';
      rail.dataset.ready = '';
    }

    placeThumb();
    const resize = new ResizeObserver(placeThumb);
    resize.observe(rail);
    resize.observe(button);
    return () => resize.disconnect();
  }, [value]);

  return (
    <div className="rubber-segment" ref={track} role="group" aria-label={label}>
      <span className="rubber-segment__thumb" ref={thumb} aria-hidden="true"/>
      {items.map(item => (
        <button className="rubber-segment__item" key={item.value} type="button"
          ref={item.value === value ? selected : null} aria-pressed={item.value === value}
          onClick={() => { if (item.value !== value) onChange(item.value); }}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
