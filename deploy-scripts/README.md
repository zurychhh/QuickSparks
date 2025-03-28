# Skrypty wdrożeniowe PDFSpark

Ten katalog zawiera skrypty automatyzujące wdrażanie aplikacji PDFSpark.

## Wymagania wstępne

1. Node.js (v18+)
2. npm
3. Konto Vercel
4. Konto GitHub z uprawnieniami administratora do repozytorium
5. GitHub CLI (gh) - do konfiguracji GitHub
6. Vercel CLI - do wdrażania frontendu (zainstalowany automatycznie przez skrypt)

## Konfiguracja zmiennych środowiskowych

Przed użyciem skryptów należy ustawić następujące zmienne środowiskowe:

### Dla Vercel:
```
export VERCEL_TOKEN=<Twój token API Vercel>
export VERCEL_ORG_ID=<ID Twojej organizacji Vercel>
export VERCEL_PROJECT_ID=<ID projektu Vercel>
```

### Dla GitHub:
```
export GITHUB_TOKEN=<Twój Personal Access Token GitHub>
```

### Dla Render:
```
export RENDER_DEPLOY_HOOK=<URL hooka wdrożeniowego Render>
```

## Dostępne skrypty

### 1. Wdrażanie frontendu na Vercel

```bash
node deploy-vercel.js
```

Ten skrypt:
- Sprawdza, czy Vercel CLI jest zainstalowany
- Loguje się do Vercel używając podanego tokenu API
- Pobiera konfigurację projektu
- Buduje projekt
- Wdraża zbudowany projekt do produkcji

### 2. Konfiguracja GitHub

```bash
node setup-github.js
```

Ten skrypt:
- Loguje się do GitHub CLI używając podanego tokenu
- Konfiguruje ochronę gałęzi produkcyjnej (branch protection)
- Dodaje wymagane sekrety dla GitHub Actions (Vercel, Render)

## Automatyzacja wdrażania

Skrypty można uruchamiać ręcznie, ale mogą też być częścią procesu CI/CD.

Przykład użycia w GitHub Actions:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Deploy Frontend to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
        run: node ./deploy-scripts/deploy-vercel.js
```

## Rozwiązywanie problemów

Jeśli napotkasz problemy z wdrażaniem:

1. Sprawdź czy wszystkie zmienne środowiskowe są poprawnie ustawione
2. Upewnij się, że masz odpowiednie uprawnienia w GitHub i Vercel
3. Sprawdź czy tokeny dostępu nie wygasły
4. Przejrzyj logi CI/CD lub wyjście konsoli dla szczegółowych komunikatów błędów

W razie pytań lub problemów, skontaktuj się z zespołem DevOps.