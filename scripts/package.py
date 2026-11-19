from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib

root = Path(__file__).resolve().parents[1]
def releasable(path):
    parts = path.relative_to(root).parts
    # Execution diagnostics may contain local paths or future user data. They
    # remain available locally, but are never part of the distributable toolkit.
    return (not any(root.joinpath(*parts[:i]).is_symlink() for i in range(1, len(parts) + 1))
            and not any(part.startswith('.') for part in parts)
            and not any(part in {'downloads', '__pycache__', 'pipeline-failures'} for part in parts)
            and parts != ('docs', 'pipeline-status.json')
            and path.suffix != '.pyc')

out = root / 'dist/downloads'
out.mkdir(parents=True, exist_ok=True)
target = out / 'canopy-local.zip'
files = []
for name in ['package.json', 'server.mjs', 'cli.mjs', 'README.md', 'DEVELOPMENT.md', 'LICENSE']:
    source = root / name
    if source.is_symlink() or not source.is_file():
        raise ValueError(f'Required release input must be a regular file: {name}')
    files.append(source)
for folder in ['dist', 'docs', 'scripts', 'tests', 'research']:
    for source in sorted((root / folder).rglob('*')):
        if source.is_file() and releasable(source):
            files.append(source)
with ZipFile(target, 'w', ZIP_DEFLATED) as z:
    for source in files:
        z.write(source, 'canopy/' + str(source.relative_to(root)))
(out / 'SHA256SUMS.txt').write_text(hashlib.sha256(target.read_bytes()).hexdigest() + '  canopy-local.zip\n')
print(f'{target}: {target.stat().st_size:,} bytes')
