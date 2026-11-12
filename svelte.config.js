import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      // SPA fallback: shell pkgServe may request /browser without .html;
      // client router handles the route after index.html loads.
      fallback: 'index.html',
      precompress: false,
      strict: true
    }),
    paths: { relative: true }
  }
};

export default config;
