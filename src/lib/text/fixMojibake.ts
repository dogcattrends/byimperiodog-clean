const MOJIBAKE_PATTERNS: [RegExp, string][] = [
  [/Ã¡/g, "á"],
  [/Ã/g, "Á"],
  [/Ã©/g, "é"],
  [/Ã‰/g, "É"],
  [/Ãº/g, "ú"],
  [/Ãš/g, "Ú"],
  [/Ã³/g, "ó"],
  [/Ã“/g, "Ó"],
  [/Ã£/g, "ã"],
  [/Ã£/g, "ã"],
  [/Ã§/g, "ç"],
  [/Ã‡/g, "Ç"],
  [/Ãª/g, "ê"],
  [/ÃŠ/g, "Ê"],
  [/Ãª/g, "ê"],
  [/Ã´/g, "ô"],
  [/Ã”/g, "Ô"],
  [/Ã±/g, "ñ"],
  [/Ã‘/g, "Ñ"],
  [/Ã¨/g, "è"],
  [/Ãˆ/g, "È"],
  [/Ã¯/g, "ï"],
  [/Ã¯/g, "ï"],
  [/Ã¼/g, "ü"],
  [/Ãœ/g, "Ü"],
];

export function fixMojibake(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (!value.includes("Ã")) return value;
  return MOJIBAKE_PATTERNS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}
