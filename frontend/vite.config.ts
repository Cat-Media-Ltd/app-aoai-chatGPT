import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    base: '/static/', // tells Vite assets are served from /static/
    plugins: [
      react(),
      VitePWA({
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        registerType: 'autoUpdate',
        manifest: {
          name: 'HubSpot Expert by Cat Media',
          short_name: 'HubSpot Expert',
          description: 'HubSpot Expert by Cat Media',
          theme_color: '#f3f3f3',
          start_url: '/',   // root url 
          icons: [
            {
              src: 'Cat Media Mascot.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'Cat Media Mascot.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
      {
        name: 'inject-hubspot',
        transformIndexHtml(html) {
          if (isProd) {
            // Inject HubSpot tracking code right after the opening <head> tag
            const hubspotScript = `
              <script
                type="text/javascript"
                id="hs-script-loader"
                async
                defer
                src="//js.hs-scripts.com/5728857.js">
              </script>
            `;
            return html.replace('<head>', `<head>\n${hubspotScript}`);
          }
          return html;
        },
      },
    ],
    build: {
      outDir: '../static',
      emptyOutDir: true,
      sourcemap: true,
      manifest: true,
    },
    server: {
      proxy: {
        '/ask': 'http://localhost:5000',
        '/chat': 'http://localhost:5000'
      }
    }
  }
});
