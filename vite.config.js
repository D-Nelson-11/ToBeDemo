import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'

// base relativo: funciona igual en local, en preview y en GitHub Pages
// (con HashRouter no hace falta configurar 404.html ni el nombre del repo).
export default defineConfig({
  plugins: [react(), tailwind()],
  base: './',
})
