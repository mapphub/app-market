import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      // Do NOT set fallback: 'index.html' — adapter overwrites the prerendered
      // root page with an empty SPA shell (404 on home). Shell pkgServe already
      // resolves /browser → browser.html and SPA-falls back to real index.html.
      fallback: undefined,
      precompress: false,
      strict: true
    }),
    paths: { relative: true }
  }
};

export default config;
