import { useEffect, useRef, useState } from 'react';

// Pins are authored against the full photograph; compensate for object-cover cropping.
export default function useCoverCoordinates(imageUrl) {
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
  const position = point => {
    if (!frame) return { left: point.x, top: point.y };
    const scale = Math.max(frame.width / frame.naturalWidth, frame.height / frame.naturalHeight);
    const width = frame.naturalWidth * scale, height = frame.naturalHeight * scale;
    return { left: `${(parseFloat(point.x) / 100 * width - (width - frame.width) / 2) / frame.width * 100}%`, top: `${(parseFloat(point.y) / 100 * height - (height - frame.height) / 2) / frame.height * 100}%` };
  };
  return { imageRef, position };
}
