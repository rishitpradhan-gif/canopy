from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib

root = Path(__file__).resolve().parents[1]
out = root / 'dist/downloads'
out.mkdir(parents=True, exist_ok=True)
target = out / 'canopy-local.zip'
with ZipFile(target, 'w', ZIP_DEFLATED) as z:
    for name in ['package.json', 'server.mjs', 'cli.mjs', 'README.md', 'LICENSE']:
        z.write(root / name, 'canopy/' + name)
    for folder in ['dist', 'docs', 'scripts', 'tests']:
        for p in sorted((root / folder).rglob('*')):
            if p.is_file() and 'downloads' not in p.relative_to(root).parts and '__pycache__' not in p.parts:
                z.write(p, 'canopy/' + str(p.relative_to(root)))
(out / 'SHA256SUMS.txt').write_text(hashlib.sha256(target.read_bytes()).hexdigest() + '  canopy-local.zip\n')
print(f'{target}: {target.stat().st_size:,} bytes')
