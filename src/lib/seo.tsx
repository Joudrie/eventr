/**
 * Page title and share metadata.
 *
 * Two reasons this is not cosmetic. First, a link someone texts a friend renders as a
 * blank tab and a preview-less grey box without it — which is most of what decides
 * whether the friend taps. Second, crawlable event pages were the stated reason for
 * choosing static web rendering back in Phase 0, and a page with an empty `<title>`
 * is not meaningfully crawlable.
 *
 * On native this is a no-op, which is why it can be rendered unconditionally.
 */

import Head from 'expo-router/head';

const SITE_NAME = 'Eventr';
const CANONICAL_ORIGIN = 'https://seanjoudrie.github.io/eventr';

export type SeoProps = {
  /** Page-specific part. The site name is appended, except on the home page. */
  title?: string;
  description: string;
  /** Path within the site, e.g. `/event/abc`. Used for the canonical and og:url. */
  path?: string;
};

export function Seo({ title, description, path = '/' }: SeoProps) {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — what's happening near you`;
  const url = `${CANONICAL_ORIGIN}${path === '/' ? '' : path}`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />

      {/* Summary rather than summary_large_image: we have no share artwork yet, and
          the large card renders as an empty grey slab when the image is missing. */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Head>
  );
}
