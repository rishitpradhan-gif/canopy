"""Optional development check. Requires Python 3 and Node 22+."""
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZipFile
from urllib.request import urlopen
import subprocess, os, socket, time, json

root = Path(__file__).resolve().parents[1]
with TemporaryDirectory(prefix='canopy-package-') as temp:
    with ZipFile(root/'dist/downloads/canopy-local.zip') as z:
        assert z.testzip() is None
        z.extractall(temp)
    app = Path(temp)/'canopy'
    output = subprocess.check_output(['node','cli.mjs','analyze','docs/example-capsule.json'], cwd=app)
    report = json.loads(output)
    assert report['summary']['shared_windows'] == 6
    with socket.socket() as s:
        s.bind(('127.0.0.1',0))
        port=s.getsockname()[1]
    p = subprocess.Popen(['node','server.mjs'], cwd=app, env={**os.environ,'PORT':str(port)}, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        for _ in range(50):
            try:
                with urlopen(f'http://127.0.0.1:{port}',timeout=1) as r:
                    assert r.status==200 and b'A signal needs' in r.read()
                break
            except OSError:
                if p.poll() is not None:
                    raise RuntimeError(p.stderr.read().decode())
                time.sleep(.1)
        else:
            raise RuntimeError('Extracted app did not start')
        print(json.dumps({'zip_integrity':'passed','extracted_cli':'passed','extracted_app':'passed','shared_windows':6}))
    finally:
        p.terminate()
        p.communicate(timeout=5)
