"""Export a reproducible checkout without credentials, dependencies or artifacts."""
from pathlib import Path
import tarfile

root = Path(__file__).resolve().parent.parent
output = root / 'output' / 'shadowops-source.tar.gz'
output.parent.mkdir(exist_ok=True)
names = ['src', 'server', 'api', 'tests', 'scripts', 'docs', 'tasks', 'public', 'server.ts', 'package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'vercel.json', 'README.md', 'LICENSE', 'PRD.md', '.gitignore', '.env.example']
with tarfile.open(output, 'w:gz') as archive:
    for name in names:
        path = root / name
        if not path.exists():
            continue
        files = sorted(path.rglob('*')) if path.is_dir() else [path]
        for file in files:
            if not file.is_file() or file.is_symlink():
                continue
            if (file.name.startswith('.env') and file.name != '.env.example') or '__pycache__' in file.parts:
                continue
            archive.add(file, arcname=file.relative_to(root), recursive=False)
print(output)
