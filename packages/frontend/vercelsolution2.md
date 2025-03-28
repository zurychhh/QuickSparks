/*
===========================================
KOMPLETNE ROZWIĄZANIE PROBLEMÓW Z MIME TYPE DLA PDFSPARK
===========================================

Ten plik zawiera wszystkie potrzebne poprawki i rozwiązania
dla problemu z MIME type w aplikacji PDFSpark na Vercel.

Zawiera kilka podejść - od najprostszych do bardziej zaawansowanych.
Sugeruję zacząć od Rozwiązania 1 i jeśli to nie zadziała,
przejść do kolejnych.

*/

//===========================================
// ROZWIĄZANIE 1: PODSTAWOWA KOREKTA PLIKÓW KONFIGURACYJNYCH
//===========================================

// 1.1. Poprawiona wersja vercel.json
// Zapisz jako vercel.json w głównym katalogu projektu
/*
{
  "rewrites": [
    { "source": "/pdfspark", "destination": "/index.html" },
    { "source": "/pdfspark/(.*)", "destination": "/$1" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
*/

// 1.2. Poprawiona wersja vite.config.js
// Zapisz jako vite.config.js w głównym katalogu projektu
/*
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Ustaw bazową ścieżkę dla aplikacji
  base: '/pdfspark/',

  build: {
    // Upewnij się, że wszystkie zasoby mają odpowiednie ścieżki
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,

    // Wyłącz sourcemaps dla prostszego buildu
    sourcemap: false,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
*/

//===========================================
// ROZWIĄZANIE 2: HASHROUTER ZAMIAST BROWSERROUTER
//===========================================

// 2.1. main.jsx z HashRouter
// Zapisz jako src/main.jsx (zastąp istniejący plik)
/*
import React from 'react'
import ReactDOM from 'react-dom/root'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
*/

// 2.2. App.jsx dostosowany do HashRouter
// Zapisz jako src/App.jsx (zastąp istniejący plik)
/*
import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
// import './App.css' // Zaimportuj jeśli potrzebujesz stylów

// Przykładowe komponenty stron
const Home = () => <div className="page">Strona główna PDFSpark</div>
const ConvertPage = () => <div className="page">Konwersja PDF</div>
const CompressPage = () => <div className="page">Kompresja PDF</div>
const AboutPage = () => <div className="page">O PDFSpark</div>

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>PDFSpark</h1>
        <nav>
          {/*
            Przy HashRouter nie potrzebujemy basename,
            linki działają tak samo
          */}
          <Link to="/">Strona główna</Link>
          <Link to="/convert">Konwersja</Link>
          <Link to="/compress">Kompresja</Link>
          <Link to="/about">O nas</Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/convert" element={<ConvertPage />} />
          <Route path="/compress" element={<CompressPage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Obsługa innych ścieżek - przekierowanie na stronę główną */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      <footer>
        <p>© {new Date().getFullYear()} PDFSpark - część QuickSpark</p>
      </footer>
    </div>
  )
}

export default App
*/

// 2.3. index.html bez tagu base
// Zapisz jako index.html w głównym katalogu projektu
/*
<!DOCTYPE html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Usunięty tag base, który mógł powodować problemy -->

    <!-- Favicon z prawidłową ścieżką -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    <!-- SEO Meta tagi -->
    <meta name="description" content="PDFSpark - konwertuj, kompresuj i edytuj pliki PDF online" />
    <meta name="keywords" content="PDF, konwersja, kompresja, edycja, online" />

    <title>PDFSpark - Narzędzie do PDF</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
*/

//===========================================
// ROZWIĄZANIE 3: UŻYCIE PLIKU _redirects
//===========================================

// 3.1. Plik _redirects dla lepszej obsługi routingu
// Zapisz jako public/_redirects w folderze public projektu
/*
/pdfspark/* /index.html 200
/* /index.html 200
*/

//===========================================
// ROZWIĄZANIE 4: MINIMALISTYCZNE PODEJŚCIE
//===========================================

// 4.1. Uproszczona wersja vite.config.js
// Zapisz jako vite.config.js w głównym katalogu projektu
/*
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './' // Relatywne ścieżki zamiast absolutnych
})
*/

// 4.2. Uproszczony vercel.json
// Zapisz jako vercel.json w głównym katalogu projektu
/*
{
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
*/

//===========================================
// ROZWIĄZANIE 5: KONFIGURACJA DLA ZWYKŁEJ DOMENY (BEZ PODKATALOGU)
//===========================================

// 5.1. vite.config.js bez base path
// Zapisz jako vite.config.js w głównym katalogu projektu
/*
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Bez base path dla wdrożenia na głównej domenie
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  }
})
*/

// 5.2. main.jsx z BrowserRouter bez basename
// Zapisz jako src/main.jsx
/*
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
*/

// 5.3. Prosty vercel.json dla głównej domeny
// Zapisz jako vercel.json w głównym katalogu projektu
/*
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
*/

//===========================================
// INSTRUKCJA RESETOWANIA PROJEKTU VERCEL
//===========================================
/*
Jeśli żadne z powyższych rozwiązań nie działa, reset projektu na Vercel może pomóc:

1. W panelu Vercel, przejdź do ustawień projektu
2. Znajdź sekcję "Project Settings" > "Advanced"
3. Na dole strony znajdź przycisk "Delete Project"
4. Utwórz projekt od nowa, importując repozytorium
5. Podczas konfiguracji nowego projektu upewnij się, że:
   - Framework Preset: Vite
   - Build Command: npm run build
   - Output Directory: dist
   - Install Command: npm install

*/

//===========================================
// STRATEGIE WDRAŻANIA I TESTOWANIA
//===========================================
/*
Aby efektywnie wdrożyć i przetestować rozwiązania:

1. Najpierw spróbuj Rozwiązania 2 (HashRouter) - to najprostsza i najbardziej niezawodna metoda.
   Linki będą wyglądać jak /pdfspark/#/about zamiast /pdfspark/about.

2. Jeśli chcesz zachować czyste URL-e:
   - Zaimplementuj Rozwiązanie 1 i przetestuj
   - Jeśli nie działa, dodaj plik _redirects z Rozwiązania 3

3. Przed każdym wdrożeniem:
   - Testuj lokalnie: npm run build && npx serve -s dist
   - Sprawdź czy pliki w folderze dist mają prawidłową strukturę

4. Diagnozowanie problemów:
   - Użyj Network tab w DevTools by zobaczyć dokładne błędy
   - Sprawdź czy serwer zwraca prawidłowe nagłówki Content-Type
   - Zweryfikuj czy wszystkie zasoby są poprawnie ładowane
*/

//===========================================
// ROZWIĄZANIE 6: OSTATECZNE ROZWIĄZANIE Z EKSPERYMENTALNĄ KONFIGURACJĄ
//===========================================

// 6.1. vercel.json z eksperymentalnymi opcjami
// Zapisz jako vercel.json w głównym katalogu projektu
/*
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/pdfspark/assets/(.*)",
      "headers": { "cache-control": "public, max-age=31536000, immutable" },
      "dest": "/assets/$1"
    },
    { "src": "/pdfspark", "dest": "/index.html" },
    { "src": "/pdfspark/(.*)", "dest": "/index.html" }
  ]
}
*/

// 6.2. Zaktualizowany package.json
// Zaktualizuj istniejący package.json
/*
{
  "name": "pdfspark",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build && cp dist/index.html dist/200.html && cp dist/index.html dist/404.html",
    "preview": "vite preview",
    "test-deploy": "npm run build && npx serve -s dist"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.55.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "serve": "^14.2.1",
    "vite": "^5.0.8"
  }
}
*/

//===========================================
// ROZWIĄZANIE 7: SKRYPT DO RĘCZNEJ NAPRAWY STRUKTURY PLIKÓW
//===========================================

// 7.1. Skrypt fix-paths.js do uruchomienia po buildzie
// Zapisz jako scripts/fix-paths.js
/*
const fs = require('fs');
const path = require('path');

// Funkcja pomocnicza do rekurencyjnego przechodzenia po folderach
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

// Ścieżka do katalogu dist
const distDir = path.resolve(__dirname, '../dist');

// 1. Kopiowanie pliku index.html do 404.html dla lepszej obsługi SPA
console.log('Kopiowanie index.html do 404.html...');
fs.copyFileSync(path.join(distDir, 'index.html'), path.join(distDir, '404.html'));

// 2. Aktualizacja ścieżek w plikach HTML
console.log('Aktualizowanie ścieżek w plikach HTML...');
const htmlFiles = [path.join(distDir, 'index.html'), path.join(distDir, '404.html')];

htmlFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Aktualizacja ścieżek do zasobów
    content = content.replace(/href="\/pdfspark\//g, 'href="./');
    content = content.replace(/src="\/pdfspark\//g, 'src="./');

    fs.writeFileSync(filePath, content);
  }
});

// 3. Aktualizacja ścieżek w plikach JS i CSS
console.log('Aktualizowanie ścieżek w plikach JS i CSS...');
walkDir(distDir, filePath => {
  // Tylko pliki JS i CSS
  if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Aktualizacja ścieżek do zasobów
    content = content.replace(/\/pdfspark\//g, './');

    fs.writeFileSync(filePath, content);
  }
});

console.log('Zakończono naprawę ścieżek!');
*/

// 7.2. Zaktualizowany package.json z nowym skryptem
// Zaktualizuj swój package.json o ten skrypt build
/*
{
  "scripts": {
    "build": "vite build && node scripts/fix-paths.js",
    ...
  }
}
*/

//===========================================
// NAJLEPSZE PODEJŚCIE - ROZWIĄZANIE Z HASHROUTER (REKOMENDOWANE)
//===========================================

// Główne pliki do aktualizacji dla najlepszego rozwiązania:

// 1. vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // Użyj ścieżek relatywnych dla prostszego wdrożenia
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
  }
})

// 2. main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css' // Jeśli potrzebujesz stylów

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)

// 3. vercel.json
/*
{
  "rewrites": [{
    "source": "/(.*)",
    "destination": "/index.html"
  }]
}
*/

// 4. index.html
/*
<!DOCTYPE html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
    <title>PDFSpark - Narzędzie do PDF</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/main.jsx"></script>
  </body>
</html>
*/

// 5. App.jsx - bez zmian, z wyjątkiem importu HashRouter zamiast BrowserRouter

//===========================================
// FINALNA INSTRUKCJA WDROŻENIA
//===========================================
/*
KROK PO KROKU:

1. Zastosuj rekomendowane rozwiązanie z HashRouter (najlepsze podejście):
   - Zaktualizuj vite.config.js - użyj base: './'
   - Zmień BrowserRouter na HashRouter w main.jsx
   - Dodaj prosty vercel.json
   - Upewnij się, że index.html używa relatywnych ścieżek

2. Wykonaj build projektu:
   - npm run build
   - Sprawdź strukturę wygenerowanych plików w dist/

3. Testuj lokalnie:
   - npx serve -s dist
   - Otwórz przeglądarkę pod adresem http://localhost:3000

4. Wdróż na Vercel:
   - git add .
   - git commit -m "Fix MIME type issues with HashRouter solution"
   - git push

5. Po wdrożeniu sprawdź w przeglądarce:
   - Otwórz konsolę deweloperską (F12)
   - Przejdź do zakładki Network
   - Sprawdź czy wszystkie zasoby ładują się bez błędów MIME type

Powodzenia!
*/
