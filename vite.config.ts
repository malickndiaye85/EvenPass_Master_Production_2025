import { defineConfig, Plugin, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync, readdirSync, copyFileSync, existsSync } from 'fs';
import { join } from 'path';

const buildTimestamp = Date.now();

/**
 * Plugin pour copier les fichiers HTML et JS statiques de public/ vers dist/
 * Nécessaire pour les scans EPscanV/EPscanT et les accès contrôleurs
 */
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
        'epscanv-maritime.html',
        'admin-test-samapass.html',
        'epscant-transport.html',
        'epscant-login.html',
        'test-ticket.html'
      ];

      const jsFilesToCopy = [
        'epscant-line-sectorization.js',
        'epscant-alerts.js',
        'ops-events-scanner.js'
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

      jsFilesToCopy.forEach(file => {
        const srcPath = join(publicPath, file);
        const destPath = join(distPath, file);
        if (existsSync(srcPath)) {
          copyFileSync(srcPath, destPath);
          copiedCount++;
        }
      });

      console.log(`✓ Copied ${copiedCount} HTML/JS files from public/ to dist/`);
    }
  };
};

/**
 * Plugin pour injecter les variables d'environnement Firebase directement dans le HTML
 * Utilise les secrets GitHub en priorité pour la production demdem.sn
 */
const inlineEnvPlugin = (): Plugin => {
  return {
    name: 'inline-env-plugin',
    apply: 'build',
    closeBundle() {
      const distPath = join(__dirname, 'dist');
      
      // FUSION CRUCIALE : On charge les variables du .env ET du système (GitHub Secrets)
      const env = { 
        ...process.env, 
        ...loadEnv('production', process.cwd(), '') 
      };

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
console.log('[PROD] Firebase config injected successfully');
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
        console.log(`✓ Env injected in ${htmlFiles.length} files`);
      } catch (e) {
        console.error('Env injection failed:', e);
      }
    }
  };
};

export default defineConfig({
  base: '/',
  plugins: [react(), copyPublicHtmlPlugin(), inlineEnvPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});
