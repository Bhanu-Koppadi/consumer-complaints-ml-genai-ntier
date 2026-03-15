/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ALLOW_INSECURE_TOKEN_STORAGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
