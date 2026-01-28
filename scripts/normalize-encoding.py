import pathlib

mapping = {
    'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
    'Ã£': 'ã', 'Ãµ': 'õ', 'Ã§': 'ç', 'Ãª': 'ê', 'Ã´': 'ô',
    'Ã ': 'à', 'Ã¢': 'â', 'Ã¼': 'ü', 'Ã±': 'ñ',
    'Ã‰': 'É', 'Ã�': 'Í', 'Ã“': 'Ó', 'Ãš': 'Ú', 'Ã‡': 'Ç',
    'ÃŠ': 'Ê', 'Ã”': 'Ô', 'Ã€': 'À', 'Ãˆ': 'È',
    'Ã‚': 'Â', 'Ã„': 'Ä', 'Ã–': 'Ö', 'ÃŸ': 'ß'
}
allowed_dirs = {'app','docs','lib','src','tests','studio','scripts','sql','public','content','design-system'}
allowed_exts = {'.ts','.tsx','.js','.jsx','.mjs','.cjs','.md','.mdx','.sql','.json','.txt'}
root = pathlib.Path('.')
updated = 0
for path in root.rglob('*'):
    if not path.is_file():
        continue
    if path.suffix not in allowed_exts:
        continue
    if path.parts[0] not in allowed_dirs:
        continue
    if path.relative_to(root).parts[0].startswith('.'):
        continue
    text = path.read_text(encoding='utf-8')
    new_text = text
    for old, new in mapping.items():
        if old in new_text:
            new_text = new_text.replace(old, new)
    if new_text != text:
        path.write_text(new_text, encoding='utf-8')
        updated += 1
print(f'Updated {updated} files')
