/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_OWNER?: string
  readonly VITE_DEFAULT_REPO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}