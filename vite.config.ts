import { defineConfig, Plugin, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const buildTimestamp = Date.now();

const inlineEnvPlugin = (): Plugin => {
  return {
    name: 'inline-env-plugin',
    apply: 'build',
    closeBundle() {
      const distPath = join(__dirname, 'dist');
      const env = loadEnv('production', process.cwd(), '');

      const envScript = `
window.ENV = {
  FIREBASE_API_KEY: '${env.VITE_FIREBASE_API_KEY || ''}',
  FIREBASE_AUTH_DOMAIN: '${env.VITE_FIREBASE_AUTH_DOMAIN || ''}',
  FIREBASE_DATABASE_URL: '${env.VITE_FIREBASE_DATABASE_URL || ''}',
  FIREBASE_PROJECT_ID: '${env.VITE_FIREBASE_PROJECT_ID || ''}',
  FIREBASE_STORAGE_BUCKET: '${env.VITE_FIREBASE_STORAGE_BUCKET || ''}',
  FIREBASE_MESSAGING_SENDER_ID: '${env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''}',
  FIREBASE_APP_ID: '${env.VITE_FIREBASE_APP_ID || ''}',
  FIREBASE_ADMIN_API_KEY: '${env.VITE_FIREBASE_ADMIN_API_KEY || ''}',
  FIREBASE_ADMIN_AUTH_DOMAIN: '${env.VITE_FIREBASE_ADMIN_AUTH_DOMAIN || ''}',
  FIREBASE_ADMIN_DATABASE_URL: '${env.VITE_FIREBASE_ADMIN_DATABASE_URL || ''}',
  FIREBASE_ADMIN_PROJECT_ID: '${env.VITE_FIREBASE_ADMIN_PROJECT_ID || ''}',
  FIREBASE_ADMIN_STORAGE_BUCKET: '${env.VITE_FIREBASE_ADMIN_STORAGE_BUCKET || ''}',
  FIREBASE_ADMIN_MESSAGING_SENDER_ID: '${env.VITE_FIREBASE_ADMIN_MESSAGING_SENDER_ID || ''}',
  FIREBASE_ADMIN_APP_ID: '${env.VITE_FIREBASE_ADMIN_APP_ID || ''}',
  ADMIN_UID: '${env.VITE_ADMIN_UID || ''}',
  SUPABASE_URL: '${env.VITE_SUPABASE_URL || ''}',
  SUPABASE_ANON_KEY: '${env.VITE_SUPABASE_ANON_KEY || ''}'
};
      `.trim();

      try {
        const htmlFiles = readdirSync(distPath).filter(file => file.endsWith('.html'));

        htmlFiles.forEach(file => {
          const filePath = join(distPath, file);
          let content = readFileSync(filePath, 'utf-8');

          content = content.replace(
            /<script src="\/env-config\.js"><\/script>/g,
            `<script>${envScript}</script>`
          );

          writeFileSync(filePath, content, 'utf-8');
        });

        console.log(`✓ Environment variables injected inline in ${htmlFiles.length} HTML files`);
      } catch (error) {
        console.error('Failed to inject inline env variables:', error);
      }
    }
  };
};

const swVersionPlugin = (): Plugin => {
  return {
    name: 'sw-version-plugin',
    apply: 'build',
    closeBundle() {
      const swPath = join(__dirname, 'dist', 'sw.js');
      try {
        let content = readFileSync(swPath, 'utf-8');

        content = content.replace(
          /const CACHE_VERSION = Date\.now\(\);/,
          `const CACHE_VERSION = ${buildTimestamp};`
        );

        writeFileSync(swPath, content, 'utf-8');
        console.log(`✓ Service Worker versioned with timestamp: ${buildTimestamp}`);
      } catch (error) {
        console.error('Failed to version Service Worker:', error);
      }
    }
  };
};

export default defineConfig({
  base: '/',
  plugins: [react(), inlineEnvPlugin(), swVersionPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});
