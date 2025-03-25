// This file provides TypeScript type definitions for things that TypeScript doesn't know about

// Define environment variables
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ENVIRONMENT: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// This helps with module path aliases during build
declare module '@pages/*' {
  const component: any;
  export default component;
}

declare module '@components/*' {
  const component: any;
  export default component;
}

declare module '@utils/*' {
  const util: any;
  export default util;
}

declare module '@hooks/*' {
  const hook: any;
  export default hook;
}

declare module '@services/*' {
  const service: any;
  export default service;
}

declare module '@assets/*' {
  const asset: any;
  export default asset;
}

declare module '@store/*' {
  const store: any;
  export default store;
}