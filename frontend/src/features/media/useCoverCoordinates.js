import { useEffect, useRef, useState } from 'react';

export function coverPointPosition(point, frame, focusX = 0.5, focusY = 0.5) {
  if (!frame) return { left: point.x, top: point.y };
  const scale = Math.max(frame.width / frame.naturalWidth, frame.height / frame.naturalHeight);
  const width = frame.naturalWidth * scale, height = frame.naturalHeight * scale;
  return {
    left: `${(parseFloat(point.x) / 100 * width - (width - frame.width) * focusX) / frame.width * 100}%`,
    top: `${(parseFloat(point.y) / 100 * height - (height - frame.height) * focusY) / frame.height * 100}%`,
  };
}

/* Pins are authored against the full photograph, so they have to be moved by
   whatever `object-fit: cover` threw away.

   `focus` is the same point CSS `object-position` is given, as fractions of
   the overflow: 0.5 is a centred crop, and a smaller y keeps more of the top
   of the frame. The two must always agree — the CSS decides what the visitor
   sees, this decides where the pins land, and if they disagree every pin
   drifts off its garment. Callers pass one value to both. */
export default function useCoverCoordinates(imageUrl, focus = {}) {
  const { x: focusX = 0.5, y: focusY = 0.5 } = focus;
  const imageRef = useRef(null);
  const [frame, setFrame] = useState(null);

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    const measure = () => {
      const width = image.clientWidth, height = image.clientHeight;
      if (width && height && image.naturalWidth) setFrame({ width, height, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(image); image.addEventListener('load', measure); measure();
    return () => { observer.disconnect(); image.removeEventListener('load', measure); };
  }, [imageUrl]);

  const position = point => coverPointPosition(point, frame, focusX, focusY);

  return { imageRef, position };
}
