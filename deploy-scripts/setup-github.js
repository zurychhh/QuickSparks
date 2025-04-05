const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Funkcja pomocnicza do wykonywania komend
function runCommand(command, cwd = __dirname) {
  console.log(`Wykonuję: ${command}`);
  try {
    return execSync(command, { 
      cwd, 
      stdio: 'inherit',
      env: {
        ...process.env,
        GITHUB_TOKEN: process.env.GITHUB_TOKEN
      }
    });
  } catch (error) {
    console.error(`Błąd podczas wykonywania komendy: ${command}`);
    console.error(error);
    process.exit(1);
  }
}

// Sprawdź czy GitHub CLI jest zainstalowany
try {
  execSync('gh --version', { stdio: 'ignore' });
  console.log('GitHub CLI jest zainstalowany.');
} catch (error) {
  console.error('GitHub CLI (gh) nie jest zainstalowany. Zainstaluj go ręcznie:');
  console.error('- macOS: brew install gh');
  console.error('- Windows: winget install GitHub.cli');
  console.error('- Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md');
  process.exit(1);
}

// Główna funkcja konfiguracji GitHub
async function setupGitHub() {
  try {
    console.log('Rozpoczynam konfigurację GitHub...');
    
    // Logowanie do GitHub CLI (bez interakcji)
    if (!process.env.GITHUB_TOKEN) {
      console.error('Brak tokenu GITHUB_TOKEN. Ustaw zmienną środowiskową.');
      return;
    }
    
    console.log('Logowanie do GitHub...');
    runCommand(`echo ${process.env.GITHUB_TOKEN} | gh auth login --with-token`);
    
    // Tworzenie nowej gałęzi ochronnej (branch protection)
    console.log('Konfiguracja ochrony gałęzi production...');
    
    // Sprawdź czy repozytorium istnieje i pobierz jego nazwę
    const repoInfo = JSON.parse(execSync('gh repo view --json nameWithOwner').toString());
    const repoFullName = repoInfo.nameWithOwner;
    
    // Tworzenie reguł ochrony gałęzi production
    const protectionRules = {
      required_status_checks: {
        strict: true,
        contexts: ["build", "test"]
      },
      enforce_admins: true,
      required_pull_request_reviews: {
        dismissal_restrictions: {},
        dismiss_stale_reviews: true,
        require_code_owner_reviews: true,
        required_approving_review_count: 1
      },
      restrictions: null
    };
    
    // Zapisz reguły do pliku tymczasowego
    const tempFile = path.join(__dirname, 'protection-rules.json');
    fs.writeFileSync(tempFile, JSON.stringify(protectionRules, null, 2));
    
    // Zastosuj reguły ochrony za pomocą GitHub API
    console.log(`Aplikowanie reguł ochrony dla gałęzi production w repozytorium ${repoFullName}...`);
    runCommand(`gh api repos/${repoFullName}/branches/production/protection -X PUT -F config=@${tempFile}`);
    
    // Usuń plik tymczasowy
    fs.unlinkSync(tempFile);
    
    // Tworzenie sekretu dla Vercel
    console.log('Dodawanie sekretów dla GitHub Actions...');
    
    if (process.env.VERCEL_TOKEN) {
      runCommand(`gh secret set VERCEL_TOKEN -b"${process.env.VERCEL_TOKEN}"`);
    }
    
    if (process.env.VERCEL_ORG_ID) {
      runCommand(`gh secret set VERCEL_ORG_ID -b"${process.env.VERCEL_ORG_ID}"`);
    }
    
    if (process.env.VERCEL_PROJECT_ID) {
      runCommand(`gh secret set VERCEL_PROJECT_ID -b"${process.env.VERCEL_PROJECT_ID}"`);
    }
    
    if (process.env.RENDER_DEPLOY_HOOK) {
      runCommand(`gh secret set RENDER_DEPLOY_HOOK -b"${process.env.RENDER_DEPLOY_HOOK}"`);
    }
    
    console.log('Konfiguracja GitHub została zakończona pomyślnie!');
  } catch (error) {
    console.error('Wystąpił błąd podczas konfiguracji GitHub:', error);
  }
}

// Uruchomienie funkcji konfiguracji
setupGitHub();