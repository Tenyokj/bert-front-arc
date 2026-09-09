/** Resolves only web and IPFS metadata references into safe external destinations. */
export function communityReferenceHref(uri: string | undefined): string | null {
  if (!uri) return null;
  if (uri.startsWith("https://") || uri.startsWith("http://")) return uri;
  if (uri.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${uri.slice("ipfs://".length)}`;
  return null;
}
