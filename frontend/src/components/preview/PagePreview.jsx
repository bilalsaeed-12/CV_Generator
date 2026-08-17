import { useEffect, useRef, useState } from 'react';
import ResumePage from './ResumePage';
import { cx } from '../../lib/utils';

const PAGE_W = 794;
const PAGE_H = 1123;

/**
 * Fits the fixed-size A4 page into whatever width it is given, using a
 * ResizeObserver rather than breakpoints — the builder's preview column changes
 * width for reasons Tailwind cannot see (panel collapse, zoom control).
 */
export default function PagePreview({ resume, className, maxScale = 1, showCropMarks = true }) {
  const frameRef = useRef(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return undefined;

    const measure = () => {
      const width = node.clientWidth;
      if (width > 0) setScale(Math.min(maxScale, width / PAGE_W));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [maxScale]);

  return (
    <div ref={frameRef} className={cx('relative w-full', className)}>
      <div
        className={cx('relative mx-auto text-graphite-faint', showCropMarks && 'crop-frame')}
        style={{ width: PAGE_W * scale, height: PAGE_H * scale }}
      >
        <ResumePage resume={resume} scale={scale} className="absolute left-0 top-0" />
      </div>
    </div>
  );
}
