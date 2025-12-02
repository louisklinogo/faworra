export function getWebsiteLogo(website?: string | null) {
  if (!website) return undefined;
  try {
    const url = new URL(website.startsWith("http") ? website : `https://${website}`);
    const host = url.hostname;
    return `https://logo.clearbit.com/${host}`;
  } catch {
    return undefined;
  }
}
