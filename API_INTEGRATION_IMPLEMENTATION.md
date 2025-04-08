# Integracja API Frontend-Backend - Implementacja

## Wykonane zmiany

### 1. Konfiguracja CORS w Backend

Zaktualizowano konfigurację CORS w serwisie konwersji, aby umożliwić dostęp z określonych domen:

```javascript
// Configure CORS for specific origins
const corsOptions = {
  origin: [
    'https://pdfspark.vercel.app',      // Main production domain
    'https://pdfspark-git-main.vercel.app', // Branch deployment
    'http://localhost:3000'             // For local development
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400  // 24 hours
};

// Dynamically add FRONTEND_URL to allowed origins if provided
if (env.FRONTEND_URL && !corsOptions.origin.includes(env.FRONTEND_URL)) {
  (corsOptions.origin as string[]).push(env.FRONTEND_URL);
}

app.use(cors(corsOptions));
```

### 2. Zwiększenie limitów rozmiaru plików

Zwiększono limity rozmiaru plików dla JSON i danych zakodowanych URL:

```javascript
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
```

### 3. Konfiguracja Proxy w Vercel

Zaktualizowano plik `vercel.json`, aby przekierować żądania `/api/*` do backendu:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://pdfspark-api.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" }
      ]
    }
  ]
}
```

### 4. Zmienne środowiskowe dla Backend

Dodano zmienną `FRONTEND_URL` w konfiguracji zmiennych środowiskowych:

```typescript
interface Environment {
  // ...existing properties
  FRONTEND_URL: string;
  // ...other properties
}

const env: Environment = {
  // ...existing defaults
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  // ...other defaults
};
```

Dodano `FRONTEND_URL` do listy wymaganych zmiennych środowiskowych w trybie produkcyjnym.

## Pozostałe zadania do wykonania

### 1. Konfiguracja backendu na Render.com

1. **Ustaw zmienne środowiskowe na Render.com:**
   - `PORT`: 10000
   - `NODE_ENV`: production
   - `FRONTEND_URL`: https://pdfspark.vercel.app
   - `BASE_URL`: https://pdfspark-api.onrender.com
   - Inne specyficzne zmienne środowiskowe wymagane przez aplikację

2. **Skonfiguruj automatyczne wdrażanie:**
   - Włącz "Auto-Deploy" dla wybranej gałęzi

### 2. Modyfikacja konfiguracji API w frontencie

Frontend jest już skonfigurowany do używania względnego adresu URL `/api` w środowisku produkcyjnym, które będzie obsługiwane przez proxy Vercel. Nie są wymagane dodatkowe zmiany w konfiguracji API.

### 3. Testy integracji frontend-backend

1. **Sprawdź status backendu:** 
   - Otwórz adres `https://pdfspark-api.onrender.com/api/health` (lub inny endpoint typu health check)
   - Powinieneś zobaczyć odpowiedź (np. `{"status":"ok"}`)

2. **Przetestuj proxy w Vercel:**
   - Otwórz adres frontendu: `https://pdfspark.vercel.app`
   - Otwórz narzędzia deweloperskie (F12) > Zakładka Network
   - Wykonaj operację, która wywołuje API (np. prześlij plik PDF)
   - Sprawdź, czy żądania do `/api/*` są kierowane do backendu

3. **Przeprowadź pełny test konwersji:**
   - Załaduj plik PDF
   - Sprawdź czy konwersja działa poprawnie
   - Pobierz plik wynikowy

## Rozwiązywanie potencjalnych problemów

### Problemy z CORS

Jeśli występują błędy CORS:
1. Upewnij się, że adres pochodzenia żądania jest na liście dozwolonych domen w konfiguracji CORS
2. Sprawdź, czy nagłówki CORS są prawidłowo ustawione w odpowiedziach z backendu
3. Upewnij się, że żądania OPTIONS (preflight) są prawidłowo obsługiwane

### Problemy z przekierowaniem Proxy

Jeśli żądania API nie są przekierowywane poprawnie:
1. Sprawdź konfigurację `rewrites` w pliku `vercel.json`
2. Upewnij się, że backend jest dostępny pod skonfigurowanym adresem
3. Sprawdź logi wdrożenia w panelu Vercel

### Problemy z przesyłaniem plików

Jeśli występują problemy z przesyłaniem plików:
1. Sprawdź, czy wielkość pliku nie przekracza limitów skonfigurowanych na backendzie
2. Upewnij się, że formularz używa prawidłowego typu kodowania `multipart/form-data`
3. Sprawdź, czy middleware do obsługi plików (np. multer) jest prawidłowo skonfigurowany

## Monitoring

Regularnie monitoruj:
1. Logi backendu na Render.com
2. Logi frontendu na Vercel
3. Konsolę przeglądarki pod kątem błędów w interakcji API
4. Statystyki wydajności systemu na produkcji