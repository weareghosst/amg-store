const URL_PADRAO = "https://amg-store-ruby.vercel.app";

/** Retorna a origem pública do site sem barra final. */
export function getPublicSiteUrl(): string {
  const configured =
    process.env.APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    URL_PADRAO;
  const withProtocol = /^https?:\/\//i.test(configured)
    ? configured
    : `https://${configured}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return URL_PADRAO;
  }
}

export function absoluteSiteUrl(pathname = "/"): string {
  return new URL(pathname, `${getPublicSiteUrl()}/`).toString();
}
