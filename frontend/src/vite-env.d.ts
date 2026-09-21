/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'virtual:pwa-register' {
  export function registerSW(options?: any): (reloadPage?: boolean) => Promise<void>;
}

declare module './data/caFinalSyllabus' {
  export const CA_FINAL_SYLLABUS: any;
}
