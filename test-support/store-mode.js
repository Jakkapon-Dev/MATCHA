export function readStoreMode(response) {
  const mode = response.body?.data?.mode;
  if (response.status !== 200 || response.body?.success !== true || !['demo', 'live'].includes(mode)) {
    throw new Error('Invalid /api/store-config response; audit stopped before mutations');
  }
  return mode;
}

export default { readStoreMode };
