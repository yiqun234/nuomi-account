import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    headers: {
      // This is crucial for Google Sign-In with Firebase in Vite.
      // It allows the Google login popup to safely communicate back to the main app.
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
})
