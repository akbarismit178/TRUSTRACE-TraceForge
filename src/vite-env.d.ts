/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_TAGLINE: string;
  readonly VITE_SECURITY_INVARIANT_ALERT_THRESHOLD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
