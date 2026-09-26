import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// The source SVG is a full-bleed square: iOS and Android apply their own corner masks.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background: '#1f4e9c' } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: '#1f4e9c' } },
  },
  images: ['public/favicon.svg'],
})
