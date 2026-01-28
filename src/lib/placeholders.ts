/**
 * Shared placeholders for Image components.
 * Prefer a subtle neutral tone to avoid flashes of pure white while we wait for the optimized asset.
 */
export const BLUR_DATA_URL: string | undefined =
 process.env.NODE_ENV === "test"
 ? undefined
 : "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjRmNGY1Ii8+PC9zdmc+";

/**
 * Transparent 1x1 GIF – useful when we need a placeholder but cannot rely on blur styles.
 */
export const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
