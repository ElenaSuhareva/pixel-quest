export function assetPath(path: string) {
  const basePath = process.env.NODE_ENV === "production" ? "/pixel-quest" : "";
  return `${basePath}${path}`;
}
