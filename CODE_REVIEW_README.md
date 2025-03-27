# PDFSpark - Przegląd kodu do Code Review

Ten folder zawiera kopię plików źródłowych projektu PDFSpark, przygotowanych do code review. Pominięto pliki node_modules, generowane artefakty i inne pliki, które nie są częścią kodu źródłowego.

## Struktura folderu

```
code-review-pdfspark/
├── packages/                          # Pakiety monorepo
│   ├── auth-service/                  # Serwis uwierzytelniania
│   │   ├── src/                       # Kod źródłowy
│   │   │   ├── controllers/           # Kontrolery
│   │   │   ├── dto/                   # Data Transfer Objects
│   │   │   ├── guards/                # Guards do ochrony endpointów
│   │   │   ├── middleware/            # Middleware
│   │   │   └── services/              # Serwisy
│   ├── conversion-service/            # Serwis konwersji plików
│   │   ├── src/                       # Kod źródłowy
│   │   │   ├── config/                # Konfiguracja
│   │   │   ├── controllers/           # Kontrolery
│   │   │   ├── middleware/            # Middleware
│   │   │   ├── models/                # Modele danych
│   │   │   ├── routes/                # Definicje tras
│   │   │   ├── services/              # Serwisy
│   │   │   ├── types/                 # Definicje typów
│   │   │   └── utils/                 # Narzędzia pomocnicze
│   ├── frontend/                      # Aplikacja frontendowa
│   │   ├── src/                       # Kod źródłowy
│   │   │   ├── components/            # Komponenty React
│   │   │   │   ├── layout/            # Komponenty layoutu
│   │   │   │   └── ui/                # Komponenty UI
│   │   │   ├── config/                # Konfiguracja
│   │   │   ├── hooks/                 # Hooki React
│   │   │   ├── pages/                 # Strony aplikacji
│   │   │   ├── services/              # Serwisy
│   │   │   ├── store/                 # Magazyn stanu
│   │   │   └── utils/                 # Narzędzia pomocnicze
│   └── shared/                        # Wspólne zasoby
│       ├── schemas/                   # Schematy walidacji
│       └── src/                       # Kod źródłowy
├── gateway/                           # API Gateway
│   └── routes/                        # Definicje tras
├── docs/                              # Dokumentacja
└── [pliki konfiguracyjne]             # Różne pliki konfiguracyjne
```

## Kluczowe pliki do przeglądu

### Integracja API Frontend-Backend

- `/packages/frontend/src/config/api.config.ts` - Konfiguracja API
- `/packages/frontend/src/services/api.ts` - Serwis API z Axios
- `/vercel.json` - Konfiguracja proxy Vercel
- `/API_INTEGRATION_IMPLEMENTATION.md` - Opis implementacji integracji

### Backend

- `/packages/conversion-service/src/index.ts` - Główny plik serwera konwersji
- `/packages/conversion-service/src/controllers/` - Logika endpointów
- `/packages/conversion-service/src/services/` - Usługi konwersji
- `/packages/auth-service/src/` - Serwis uwierzytelniania

### Frontend

- `/packages/frontend/src/App.tsx` - Główny komponent aplikacji
- `/packages/frontend/src/pages/Conversion.tsx` - Strona konwersji
- `/packages/frontend/src/components/ui/FileUpload.tsx` - Komponent do przesyłania plików

## Problemy i rozwiązania

Główne problemy, które zostały rozwiązane:

1. Integracja frontendu z backendem na produkcji
2. Konfiguracja CORS
3. Ustawienie proxy w Vercel
4. Obsługa zmiennych środowiskowych

Szczegółowe informacje o tych problemach i ich rozwiązaniach znajdują się w plikach:
- `apibackendsolution.md`
- `API_INTEGRATION_IMPLEMENTATION.md`

## Status testów

Pliki testowe znajdują się obok plików, które testują, z przyrostkiem `.test.tsx` lub `.test.ts`. Zawierają one głównie testy jednostkowe komponentów UI i logiki.