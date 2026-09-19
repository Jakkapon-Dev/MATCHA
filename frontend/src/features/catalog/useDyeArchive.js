import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { buildDyeIndex } from '../../utils/dye';

/* The archive's dyes, read once per visit and shared by every caller.

   More than one surface wants the same answer — the colour lab's reading, and
   anything else that needs to name a real colour. Fetching per caller would
   put identical requests on the wire and let them resolve in a different
   order, so the request lives at module scope and is shared. It is a promise
   rather than a resolved value, so callers that mount mid-flight await the one
   already running instead of starting a second. */

let inFlight = null;

function loadArchive() {
  if (!inFlight) {
    inFlight = api
      .getProducts({ page: 1, limit: 100 })
      .then((response) => buildDyeIndex(response?.data || []))
      .catch((error) => {
        // A failure must not be cached, or the whole session replays it.
        inFlight = null;
        throw error;
      });
  }
  return inFlight;
}

/** Every dye in the archive, hue-ordered, with how many garments carry it. */
export function useDyeArchive() {
  const [state, setState] = useState({ dyes: [], failed: false });

  useEffect(() => {
    let cancelled = false;
    loadArchive()
      .then((dyes) => { if (!cancelled) setState({ dyes, failed: false }); })
      .catch(() => { if (!cancelled) setState({ dyes: [], failed: true }); });
    return () => { cancelled = true; };
  }, []);

  return state;
}
