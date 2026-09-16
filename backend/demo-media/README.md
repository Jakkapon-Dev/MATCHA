# Public Lookbook demo bundle

These 16 public garment images and their thumbnails are copied byte-for-byte from
the existing local media store. Their original UUID filenames preserve the URLs
already saved in the demo MongoDB database. No customer files or credentials belong here.

The API serves runtime uploads first, then these manifest-listed WebP files. A fresh
checkout can therefore serve the original demo Lookbook without copying the ignored
`storage/media` directory. `manifest.json` records byte counts and SHA-256 hashes.

To refresh after intentionally changing the public demo Lookbook, run
`npm run bundle:demo-media` in `backend` while the local API is on port 5001.
Review the manifest and images before committing. The command reads the API/local
files and does not update MongoDB. It does not remove older bundled files automatically.

This is a fixed demo snapshot. New uploads still need `MEDIA_STORAGE_DIR` backed up
or must be included in a reviewed bundle before redeploying. The bundle assumes the
host uses the same demo database; a different database needs its own product/media import.

Verification: `npm test` checks the hashes and requests every image with an empty
runtime upload directory, simulating a fresh host. No online deployment is performed
by this command or by bundling images.
