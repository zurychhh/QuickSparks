# Kompleksowe rozwiązanie integracji frontendu z backendem PDFSpark

## Spis treści

1. [Diagnoza problemów](#1-diagnoza-problemów)
2. [Wdrożenie backendu na Render.com](#2-wdrożenie-backendu-na-rendercom)
3. [Konfiguracja proxy w Vercel](#3-konfiguracja-proxy-w-vercel)
4. [Aktualizacja frontendu](#4-aktualizacja-frontendu)
5. [Testowanie i monitoring](#5-testowanie-i-monitoring)
6. [Rozwiązywanie typowych problemów](#6-rozwiązywanie-typowych-problemów)

## 1. Diagnoza problemów

### Problemy frontend

- Frontend nie może komunikować się z backendem produkcyjnym
- Adres API zahardkodowany jako `http://localhost:5000/api`
- Brak przekierowania z Vercel do backendu
- Żądania do API zwracają błąd połączenia (connection refused)
- HashRouter rozwiązał wyświetlanie UI, ale nie naprawił połączenia z API

### Problemy backend

- Backend nie jest wdrożony w środowisku produkcyjnym
- Problem z wdrożeniem na Render.com (błędy z Husky i npm ci)
- Brak odpowiedniej konfiguracji CORS dla domeny produkcyjnej

## 2. Wdrożenie backendu na Render.com

Serwer render.com jest live, z sukcesem wdrozony, podloczony do github do quicksparks (naszego projektu)

2. **Dodaj prawidłową konfigurację CORS**

   Otwórz plik główny serwera (np. `server.js` lub `app.js`) i dodaj:

   ```javascript
   const cors = require('cors');

   // Konfiguracja CORS
   const corsOptions = {
     origin: [
       'https://pdfspark.vercel.app', // Główna domena produkcyjna
       'https://pdfspark-git-main.vercel.app', // Branch deployment
       'http://localhost:3000', // Dla lokalnego rozwoju
     ],
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
     credentials: true,
     maxAge: 86400, // 24 godziny
   };

   app.use(cors(corsOptions));
   ```

3. **Dodaj obsługę zmiennych środowiskowych**

   ```javascript
   const PORT = process.env.PORT || 5000;
   const NODE_ENV = process.env.NODE_ENV || 'development';
   const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

   // Dynamiczna konfiguracja CORS, jeśli potrzebna
   if (FRONTEND_URL && !corsOptions.origin.includes(FRONTEND_URL)) {
     corsOptions.origin.push(FRONTEND_URL);
   }

   // Nasłuchiwanie na określonym porcie
   app.listen(PORT, () => {
     console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
   });
   ```

4. **Upewnij się, że package.json ma prawidłowe skrypty**

   ```json
   "scripts": {
     "start": "node server.js",
     "dev": "nodemon server.js"
   }
   ```

5. **Zatwierdź i wypchnij zmiany**

   ```bash
   git add .
   git commit -m "Configure server for production deployment"
   git push
   ```

### 2.2 Konfiguracja na Render.com

2. **Skonfiguruj usługę**

   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Ustaw zmienne środowiskowe**

   - Przejdź do "Environment" > "Environment Variables"
   - Dodaj następujące zmienne:
     - `PORT`: 10000 (Render automatycznie używa tej zmiennej)
     - `NODE_ENV`: production
     - `FRONTEND_URL`: https://pdfspark.vercel.app (lub Twoja domena)
     - `HUSKY_SKIP_INSTALL`: 1
     - Inne zmienne specyficzne dla aplikacji (np. klucze API, dane bazy danych)

4. **Włącz automatyczne wdrażanie**
   - W sekcji "Settings" > "Deploy Hooks"
   - Włącz "Auto-Deploy" dla wybranej gałęzi

## 3. Konfiguracja proxy w Vercel

### 3.1 Przygotowanie konfiguracji rewrite

1. **Utwórz plik vercel.json**

   Utwórz plik `vercel.json` w głównym katalogu frontendu:

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
           {
             "key": "Access-Control-Allow-Headers",
             "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
           }
         ]
       }
     ]
   }
   ```

   > **WAŻNE**: Zastąp `https://pdfspark-api.onrender.com` faktycznym adresem URL Twojego API z Render.com

2. **Zatwierdź i wypchnij zmiany**

   ```bash
   git add vercel.json
   git commit -m "Add Vercel proxy configuration"
   git push
   ```

### 3.2 Wdrożenie na Vercel

1. **Wdróż ponownie frontend na Vercel**

   - Vercel powinien automatycznie wykryć nowe wdrożenie
   - Jeśli nie, możesz ręcznie wyzwolić nowe wdrożenie w panelu Vercel

2. **Sprawdź logi wdrożenia**
   - Upewnij się, że nowa konfiguracja została prawidłowo zastosowana
   - Zwróć uwagę na ewentualne błędy związane z konfiguracją proxy

## 4. Aktualizacja frontendu

### 4.1 Aktualizacja konfiguracji API

1. **Utwórz plik konfiguracyjny API**

   Utwórz plik `src/config/api.config.js`:

   ```javascript
   // Konfiguracja API dla różnych środowisk

   // Używamy różnych bazowych adresów URL w zależności od środowiska
   const getBaseUrl = () => {
     // W środowisku produkcyjnym używamy relatywnego URL - proxy Vercel zajmie się resztą
     if (process.env.NODE_ENV === 'production') {
       return '/api';
     }

     // W środowisku deweloperskim używamy localhost lub podanego adresu
     return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
   };

   export const API_CONFIG = {
     baseUrl: getBaseUrl(),
     timeout: 30000, // 30 sekund timeout
     endpoints: {
       convert: '/convert',
       compress: '/compress',
       status: '/status',
       download: '/download',
     },
   };

   // Pomocnicza funkcja do logowania w trybie debug
   export const logDebug = (message, data) => {
     if (process.env.NODE_ENV !== 'production') {
       console.log(`[PDFSpark API] ${message}`, data);
     }
   };
   ```

2. **Zmodyfikuj moduł api.js**

   Znajdź i zmodyfikuj plik `src/services/api.js` (lub podobny):

   ```javascript
   import axios from 'axios';
   import { API_CONFIG, logDebug } from '../config/api.config';

   // Tworzenie instancji axios z konfiguracją
   const apiClient = axios.create({
     baseURL: API_CONFIG.baseUrl,
     timeout: API_CONFIG.timeout,
     headers: {
       'Content-Type': 'application/json',
       Accept: 'application/json',
     },
   });

   // Interceptor dla requestów
   apiClient.interceptors.request.use(
     config => {
       logDebug(`Sending request to: ${config.url}`, config);
       return config;
     },
     error => {
       logDebug('Request error:', error);
       return Promise.reject(error);
     },
   );

   // Interceptor dla odpowiedzi
   apiClient.interceptors.response.use(
     response => {
       logDebug('Received response:', response);
       return response;
     },
     error => {
       logDebug('Response error:', error);

       // Lepsza obsługa błędów
       if (error.response) {
         // Serwer zwrócił odpowiedź z błędem
         console.error(`API Error [${error.response.status}]:`, error.response.data);
       } else if (error.request) {
         // Żądanie zostało wysłane, ale brak odpowiedzi
         console.error('API Error: No response received', error.request);
       } else {
         // Coś poszło nie tak podczas tworzenia żądania
         console.error('API Error:', error.message);
       }

       return Promise.reject(error);
     },
   );

   // Funkcje API

   export const uploadFile = async (file, options = {}) => {
     const formData = new FormData();
     formData.append('file', file);

     if (options.targetFormat) {
       formData.append('targetFormat', options.targetFormat);
     }

     try {
       logDebug('Uploading file', { fileName: file.name, fileSize: file.size });

       const response = await apiClient.post(API_CONFIG.endpoints.convert, formData, {
         headers: {
           'Content-Type': 'multipart/form-data',
         },
         onUploadProgress: progressEvent => {
           const percentCompleted = Math.round(
             (progressEvent.loaded * 100) / (progressEvent.total || 100),
           );
           logDebug(`Upload progress: ${percentCompleted}%`);

           // Jeśli przekazano callback dla postępu, wywołaj go
           if (options.onProgress) {
             options.onProgress(percentCompleted);
           }
         },
       });

       return response.data;
     } catch (error) {
       logDebug('File upload failed', error);
       throw error;
     }
   };

   export const checkConversionStatus = async operationId => {
     try {
       const response = await apiClient.get(`${API_CONFIG.endpoints.status}/${operationId}`);
       return response.data;
     } catch (error) {
       logDebug('Status check failed', error);
       throw error;
     }
   };

   export const downloadConvertedFile = async operationId => {
     try {
       const response = await apiClient.get(`${API_CONFIG.endpoints.download}/${operationId}`, {
         responseType: 'blob',
       });
       return response.data;
     } catch (error) {
       logDebug('File download failed', error);
       throw error;
     }
   };
   ```

3. **Zaktualizuj komponenty używające API**

   Upewnij się, że wszystkie komponenty używają zaktualizowanego modułu API:

   ```javascript
   import { uploadFile, checkConversionStatus, downloadConvertedFile } from '../services/api';

   // Przykład użycia w komponencie
   const handleFileUpload = async file => {
     try {
       setIsLoading(true);
       const result = await uploadFile(file, {
         targetFormat: 'docx',
         onProgress: progress => setUploadProgress(progress),
       });

       setOperationId(result.operationId);

       // Rozpocznij sprawdzanie statusu
       checkStatus(result.operationId);
     } catch (error) {
       setError('Wystąpił błąd podczas przesyłania pliku');
       console.error('Upload error:', error);
     } finally {
       setIsLoading(false);
     }
   };
   ```

4. **Zatwierdź i wypchnij zmiany**

   ```bash
   git add .
   git commit -m "Update API configuration for production deployment"
   git push
   ```

## 5. Testowanie i monitoring

### 5.1 Testowanie połączenia frontend-backend

1. **Sprawdź status backendu**

   - Otwórz adres backendu w przeglądarce: `https://pdfspark-api.onrender.com/api/health` (lub inny endpoint typu health check)
   - Powinieneś zobaczyć odpowiedź (np. `{"status":"ok"}`)

2. **Przetestuj proxy w Vercel**

   - Otwórz adres frontendu: `https://pdfspark.vercel.app`
   - Otwórz narzędzia deweloperskie (F12) > Zakładka Network
   - Wykonaj operację, która wywołuje API (np. prześlij plik PDF)
   - Sprawdź, czy żądania do `/api/*` są kierowane do backendu

3. **Sprawdź komunikację międzydomenową**
   - Upewnij się, że nie ma błędów CORS w konsoli
   - Sprawdź nagłówki odpowiedzi z API, czy zawierają poprawne nagłówki CORS

### 5.2 Monitoring produkcyjny

1. **Logi backendu na Render.com**

   - Przejdź do panelu Render > Twoja usługa > Logs
   - Monitoruj logi pod kątem błędów i problemów z połączeniami

2. **Logi frontendu na Vercel**

   - Przejdź do panelu Vercel > Twój projekt > Deployments > Latest Deployment > Logs
   - Sprawdź, czy nie ma błędów związanych z konfiguracją proxy

3. **Monitorowanie błędów klienta**
   - Rozważ dodanie narzędzia do śledzenia błędów (np. Sentry)
   - Monitoruj konsolę przeglądarki na produkcji

### 5.3 Testowanie pełnego cyklu konwersji

1. **Przygotuj przykładowy plik PDF**

   - Użyj małego pliku PDF (1-2 strony)

2. **Przeprowadź pełny proces konwersji**

   - Prześlij plik przez interfejs
   - Obserwuj postęp konwersji
   - Pobierz wynikowy plik

3. **Sprawdź każdy krok w narzędziach deweloperskich**
   - Żądanie przesyłania pliku (multipart/form-data)
   - Sprawdzanie statusu konwersji
   - Pobieranie wynikowego pliku

## 6. Rozwiązywanie typowych problemów

### 6.1 Problemy z CORS

**Symptom**: Błędy w konsoli typu "Access to fetch at '...' from origin '...' has been blocked by CORS policy"

**Rozwiązanie**:

1. Sprawdź konfigurację CORS w kodzie backendu
2. Upewnij się, że domena frontendu jest na liście `origin` w konfiguracji CORS
3. Sprawdź, czy nagłówki OPTIONS są obsługiwane na backendzie
4. W ostateczności, użyj bardziej permisywnej konfiguracji (tylko tymczasowo!):
   ```javascript
   app.use(cors({ origin: '*' }));
   ```

### 6.2 Problemy z adresem API

**Symptom**: Żądania API wysyłane pod niepoprawne adresy

**Rozwiązanie**:

1. Sprawdź konfigurację w pliku `api.config.js`
2. Upewnij się, że używane są relatywne ścieżki (`/api/...`) w produkcji
3. Sprawdź konfigurację proxy w `vercel.json`
4. Zweryfikuj adres docelowy backendu w konfiguracji proxy

### 6.3 Problemy z przesyłaniem plików

**Symptom**: Błędy podczas przesyłania plików PDF

**Rozwiązanie**:

1. Sprawdź limity rozmiaru plików na backendzie:
   ```javascript
   app.use(express.json({ limit: '50mb' }));
   app.use(express.urlencoded({ limit: '50mb', extended: true }));
   ```
2. Upewnij się, że formularz używa `enctype="multipart/form-data"`
3. Sprawdź, czy nagłówki Content-Type są prawidłowo ustawione
4. Zweryfikuj obsługę plików na backendzie (np. multer)

### 6.4 Problemy z proxy Vercel

**Symptom**: Żądania z /api/\* zwracają 404 lub inne błędy

**Rozwiązanie**:

1. Sprawdź konfigurację `vercel.json`
2. Upewnij się, że backend jest dostępny pod skonfigurowanym adresem
3. Sprawdź, czy ścieżki w `source` i `destination` są prawidłowe
4. Spróbuj bardziej ogólnej konfiguracji:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "https://pdfspark-api.onrender.com/api/$1" }
     ]
   }
   ```

### 6.5 Problemy z timeoutami

**Symptom**: Długie operacje konwersji przekraczają limit czasu

**Rozwiązanie**:

1. Zwiększ timeout dla żądań API:
   ```javascript
   const apiClient = axios.create({
     baseURL: API_CONFIG.baseUrl,
     timeout: 120000, // 2 minuty
   });
   ```
2. Rozważ asynchroniczną konwersję (z kolejkowaniem zadań) na backendzie
3. Dodaj mechanizm poolingu dla sprawdzania statusu długotrwałych operacji

---

To kompleksowe rozwiązanie powinno adresować wszystkie problemy z integracją frontendu i backendu PDFSpark. Po wdrożeniu tych zmian, aplikacja powinna działać prawidłowo w środowisku produkcyjnym, z frontendem na Vercel komunikującym się z backendem na Render.com.
