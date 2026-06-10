// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // SPA (client-only) rejimi — statik shell (index.html) prerender qilinadi.
    // Netlify'ga statik sayt sifatida deploy qilish uchun (SSR funksiya kerak emas).
    // Ma'lumotlar baribir client tomonda Supabase orqali olinadi.
    spa: { enabled: true, prerender: { outputPath: "/index" } },
  },
  vite: {
    esbuild: {
      // Production build'da console.log/debug/info ni olib tashlash (Q-2).
      // console.error/warn qoladi — production'da xato kuzatuvi uchun.
      // Dev'da hammasi saqlanadi.
      pure:
        process.env.NODE_ENV === "production"
          ? ["console.log", "console.debug", "console.info"]
          : [],
    },
  },
});
