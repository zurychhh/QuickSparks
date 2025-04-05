# Produkcyjne informacje o wdrożeniu

## Zmiany wprowadzone przed wdrożeniem produkcyjnym
1. Dodano package.json dla wszystkich mikroserwisów z dokładnymi zależnościami
2. Zaktualizowano Dockerfile, aby instalował zależności w odpowiednich katalogach
3. Dodano szczegółowe sprawdzanie zdrowia (health checks) do wszystkich serwisów
4. Zaktualizowano konfigurację CORS, aby akceptować połączenia z wielu domen
5. Uelastyczniono routing w Gateway, aby obsługiwał różne środowiska
6. Zliberalizowano Content-Security-Policy dla celów debugowania
7. Dodano obsługę zmiennych środowiskowych dla URL-i serwisów
## Instrukcje wdrożenia
### Render.com
1. Utwórz serwisy w Render.com zgodnie z konfiguracją w pliku render.yaml
2. Ustaw wszystkie wymagane zmienne środowiskowe
3. Wdróż backend używając ./render-deploy.sh
### Vercel
1. Utwórz projekt w Vercel i połącz go z repozytorium
2. Ustaw zmienne środowiskowe, w szczególności adres API
3. Wdróż frontend używając node deploy-scripts/deploy-vercel.js
