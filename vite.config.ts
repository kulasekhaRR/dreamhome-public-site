import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves project sites under /<repo-name>/, not the domain
// root, so the production build needs that prefix baked into asset URLs.
// Local dev stays at '/' so `npm run dev` URLs aren't affected.
export default defineConfig(({ command }) => ({
    base: command === 'build' ? '/dreamhome-public-site/' : '/',
    plugins: [react(), tailwindcss()],
}))
