// import tailwindcss from '@tailwindcss/postcss';
// import autoprefixer from 'autoprefixer';

// /** @type {import('postcss').Config} */
// module.exports = {
//   plugins: {
//     tailwindcss: {},
//     autoprefixer: {},
//   },
// };

// apps/web/postcss.config.js
// module.exports = {
//   plugins: {
//     tailwindcss: {},
//     autoprefixer: {},
//   },
// };

// postcss.config.js
// apps/web/postcss.config.cjs
/** @type {import('postcss').Config} */
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},  // ✅ must be this, not `tailwindcss: {}`
    autoprefixer: {},
  },
};

