import { defineConfig, Plugin, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync, readdirSync, copyFileSync, existsSync } from 'fs';
import { join } from 'path';

const buildTimestamp = Date.now();

const copyPublicHtmlPlugin = (): Plugin => {
  return {
    name: 'copy-public-html-plugin',
    apply: 'build',
    closeBundle() {
      const publicPath = join(__dirname, 'public');
      const distPath = join(__dirname, 'dist');

      const htmlFilesToCopy = [
        'controller-login.html',
        'epscanv-events.html',
        'epscanv-maritime.html'
      ];

      let copiedCount = 0;
      htmlFilesToCopy.forEach(file => {
        const srcPath = join(publicPath, file);
        const destPath = join(distPath, file);
        if (existsSync(srcPath)) {
          copyFileSync(srcPath, destPath);
          copiedCount++;
        }
      });

      console.log(`✓ Copied ${copiedCount} HTML files from public/ to dist/`);
    }
  };
};

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
  FIREBASE_MEASUREMENT_ID: '${env.VITE_FIREBASE_MEASUREMENT_ID || ''}',
  FIREBASE_ADMIN_API_KEY: '${env.VITE_FIREBASE_ADMIN_API_KEY || ''}',
  FIREBASE_ADMIN_AUTH_DOMAIN: '${env.VITE_FIREBASE_ADMIN_AUTH_DOMAIN || ''}',
  FIREBASE_ADMIN_DATABASE_URL: '${env.VITE_FIREBASE_ADMIN_DATABASE_URL || ''}',
  FIREBASE_ADMIN_PROJECT_ID: '${env.VITE_FIREBASE_ADMIN_PROJECT_ID || ''}',
  FIREBASE_ADMIN_STORAGE_BUCKET: '${env.VITE_FIREBASE_ADMIN_STORAGE_BUCKET || ''}',
  FIREBASE_ADMIN_MESSAGING_SENDER_ID: '${env.VITE_FIREBASE_ADMIN_MESSAGING_SENDER_ID || ''}',
  FIREBASE_ADMIN_APP_ID: '${env.VITE_FIREBASE_ADMIN_APP_ID || ''}',
  ADMIN_UID: '${env.VITE_ADMIN_UID || ''}'
};

window.__FIREBASE_CONFIG__ = {
  apiKey: "${env.VITE_FIREBASE_API_KEY || 'AIzaSyDPsWVCA_Czs64wxiBOqUCSWwbkLMPNjJo'}",
  authDomain: "${env.VITE_FIREBASE_AUTH_DOMAIN || 'evenpasssenegal.firebaseapp.com'}",
  databaseURL: "${env.VITE_FIREBASE_DATABASE_URL || 'https://evenpasssenegal-default-rtdb.europe-west1.firebasedatabase.app'}",
  projectId: "${env.VITE_FIREBASE_PROJECT_ID || 'evenpasssenegal'}",
  storageBucket: "${env.VITE_FIREBASE_STORAGE_BUCKET || 'evenpasssenegal.firebasestorage.app'}",
  messagingSenderId: "${env.VITE_FIREBASE_MESSAGING_SENDER_ID || '882782977052'}",
  appId: "${env.VITE_FIREBASE_APP_ID || '1:882782977052:web:1f2ea147010066017cf3d9'}"
};

console.log('[ENV] Firebase config loaded');
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
        console.warn('⚠️ Service Worker not found, skipping versioning');
      }
    }
  };
};

export default defineConfig({
  base: '/',
  plugins: [react(), copyPublicHtmlPlugin(), inlineEnvPlugin(), swVersionPlugin()],
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
