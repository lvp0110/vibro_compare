import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 3002;
const HTTPS_PORT = process.env.HTTPS_PORT || 3445;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// Function to inject environment variables into the HTML
const injectEnvVariables = (html) => {
  let envScript = '<script>\n';
  envScript += 'window.__ENV__ = {};\n';
  
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('VITE_')) {
      envScript += `window.__ENV__["${key}"] = "${process.env[key]}";\n`;
    }
  });
  
  envScript += '</script>';
  
  // Insert the script right after the opening <head> tag
  return html.replace('<head>', '<head>' + envScript);
};

// Сначала обрабатываем статические файлы из директории assets
app.use('/vibro_compare/assets', express.static(path.join(__dirname, 'docs/assets')));

// Для всех остальных запросов возвращаем index.html с инъектированными переменными
app.get('*', (_, res) => {
  const indexPath = path.join(__dirname, 'docs', 'index.html');
  
  fs.readFile(indexPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading index.html:', err);
      return res.status(500).send('Error loading application');
    }
    
    // Inject environment variables into HTML
    const modifiedHtml = injectEnvVariables(data);
    
    res.set('Content-Type', 'text/html');
    res.send(modifiedHtml);
  });
});

// Функция для запуска сервера
const startServer = () => {
  console.log('Environment variables available at runtime:');
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('VITE_')) {
      console.log(`  ${key}: ${process.env[key]}`);
    }
  });
};

// Запуск HTTP сервера
app.listen(HTTP_PORT, () => {
  console.log(`HTTP Server running on port ${HTTP_PORT}`);
  console.log(`Access via: http://localhost:${HTTP_PORT}`);
  startServer();
});

// Запуск HTTPS сервера (если включен)
if (USE_HTTPS) {
  try {
    // В Docker контейнере сертификаты находятся в /app/certs/
    // В локальной разработке - в ../certs/
    const certPath = fs.existsSync(path.join(__dirname, 'certs')) 
      ? path.join(__dirname, 'certs')
      : path.join(__dirname, '../certs');
      
    const httpsOptions = {
      key: fs.readFileSync(path.join(certPath, 'privkey.pem')),
      cert: fs.readFileSync(path.join(certPath, 'fullchain.pem'))
    };

    console.log("Certs", httpsOptions);

    https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
      console.log(`HTTPS Server running on port ${HTTPS_PORT}`);
      console.log(`Access via: https://localhost:${HTTPS_PORT}`);
      console.log('Note: You may see a security warning for self-signed certificate');
    });
  } catch (error) {
    console.error('Failed to start HTTPS server:', error.message);
    console.log('Make sure certificates exist in ../certs/ directory');
    console.log('Run: ./generate-certs.sh to create them');
  }
}
