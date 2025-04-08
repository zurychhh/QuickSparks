const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ścieżka do katalogu frontendu
const frontendPath = path.resolve(__dirname, '../packages/frontend');

// Funkcja pomocnicza do wykonywania komend
function runCommand(command, cwd = __dirname) {
  console.log(`Wykonuję: ${command}`);
  try {
    return execSync(command, { 
      cwd, 
      stdio: 'inherit',
      env: {
        ...process.env,
        VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID || 'prj_your_project_id',
        VERCEL_ORG_ID: process.env.VERCEL_ORG_ID || 'your_org_id',
        VERCEL_TOKEN: process.env.VERCEL_TOKEN
      }
    });
  } catch (error) {
    console.error(`Błąd podczas wykonywania komendy: ${command}`);
    console.error(error);
    process.exit(1);
  }
}

// Sprawdź czy Vercel CLI jest zainstalowany
try {
  execSync('vercel -v', { stdio: 'ignore' });
  console.log('Vercel CLI jest zainstalowany.');
} catch (error) {
  console.log('Instaluję Vercel CLI...');
  runCommand('npm install -g vercel');
}

// Główna funkcja wdrożenia
async function deployToVercel() {
  try {
    console.log('Rozpoczynam wdrożenie na Vercel...');
    
    // Przejdź do katalogu frontendu
    process.chdir(frontendPath);
    console.log(`Zmieniono katalog na: ${process.cwd()}`);
    
    // Sprawdź czy mamy wymagane zmienne środowiskowe
    if (!process.env.VERCEL_TOKEN) {
      console.error('Brak tokenu VERCEL_TOKEN. Ustaw zmienną środowiskową.');
      console.log('Próba kontynuacji bez tokena - może się nie powieść.');
      // Kontynuujemy bez tokena dla testów
    }
    
    // Logowanie do Vercel CLI (bez interakcji)
    console.log('Logowanie do Vercel...');
    runCommand(`vercel login --token ${process.env.VERCEL_TOKEN}`);
    
    // Pull konfiguracji projektu
    console.log('Pobieranie konfiguracji projektu...');
    runCommand('vercel pull --yes --environment=production');
    
    // Build projektu
    console.log('Budowanie projektu...');
    runCommand('vercel build --prod');
    
    // Deploy do Vercel
    console.log('Wdrażanie projektu...');
    runCommand('vercel deploy --prebuilt --prod');
    
    console.log('Wdrożenie zostało zakończone pomyślnie!');
  } catch (error) {
    console.error('Wystąpił błąd podczas wdrażania:', error);
  }
}

// Uruchomienie funkcji wdrożenia
deployToVercel();