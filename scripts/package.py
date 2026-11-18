from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib

root = Path(__file__).resolve().parents[1]
def releasable(path):
    parts = path.relative_to(root).parts
    # Execution diagnostics may contain local paths or future user data. They
    # remain available locally, but are never part of the distributable toolkit.
    return (not any(part.startswith('.') for part in parts)
            and not any(part in {'downloads', '__pycache__', 'pipeline-failures'} for part in parts)
            and parts != ('docs', 'pipeline-status.json')
            and path.suffix != '.pyc')

out = root / 'dist/downloads'
out.mkdir(parents=True, exist_ok=True)
target = out / 'canopy-local.zip'
with ZipFile(target, 'w', ZIP_DEFLATED) as z:
    for name in ['package.json', 'server.mjs', 'cli.mjs', 'README.md', 'DEVELOPMENT.md', 'LICENSE']:
        z.write(root / name, 'canopy/' + name)
    for folder in ['dist', 'docs', 'scripts', 'tests', 'research']:
        for p in sorted((root / folder).rglob('*')):
            if p.is_file() and releasable(p):
                z.write(p, 'canopy/' + str(p.relative_to(root)))
(out / 'SHA256SUMS.txt').write_text(hashlib.sha256(target.read_bytes()).hexdigest() + '  canopy-local.zip\n')
print(f'{target}: {target.stat().st_size:,} bytes')
