# Produkcyjne informacje o wdrożeniu
## Zmiany wprowadzone przed wdrożeniem produkcyjnym
1. Dodano szczegółowe sprawdzanie zdrowia (health checks) do wszystkich serwisów
2. Zaktualizowano konfigurację CORS, aby akceptować połączenia z wielu domen
3. Uelastyczniono routing w Gateway, aby obsługiwał różne środowiska
4. Zliberalizowano Content-Security-Policy dla celów debugowania
5. Dodano obsługę zmiennych środowiskowych dla URL-i serwisów
## Instrukcje wdrożenia
### Render.com
1. Utwórz serwisy w Render.com zgodnie z konfiguracją w pliku render.yaml
2. Ustaw wszystkie wymagane zmienne środowiskowe
3. Wdróż backend używając ./render-deploy.sh
### Vercel
1. Utwórz projekt w Vercel i połącz go z repozytorium
2. Ustaw zmienne środowiskowe, w szczególności adres API
3. Wdróż frontend używając node deploy-scripts/deploy-vercel.js
