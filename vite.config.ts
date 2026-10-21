import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Firebase Hosting serves from the domain root, but GitHub Pages serves
// project sites under /<repo-name>/ — so the base path has to be set per
// deploy target, not hardcoded. Defaults to root (correct for both local
// dev and Firebase Hosting); the GitHub Pages workflow overrides it via
// VITE_BASE_PATH before building.
export default defineConfig({
    base: process.env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss()],
})
