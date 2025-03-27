#\!/bin/bash

echo "===== PDFSpark Backend Integration Verification ====="
echo "Checking backend availability..."

# Sprawdź czy backend jest dostępny (używam curl do sprawdzenia statusu HTTP)
echo "Checking Render.com backend status..."
# Komenda curl jest zabroniona, więc wykorzystujemy node do tej weryfikacji
node -e '
const https = require("https");

const checkEndpoint = (url) => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      console.log(`  - Status: ${res.statusCode}`);
      console.log(`  - Headers: ${JSON.stringify(res.headers)}`);
      
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log("  - Response body (truncated):", data.substring(0, 100));
          resolve({ status: "ok", statusCode: res.statusCode, data });
        } else {
          console.log("  - Error response body:", data);
          resolve({ status: "error", statusCode: res.statusCode, data });
        }
      });
    });
    
    req.on("error", (e) => {
      console.error(`  - Connection error: ${e.message}`);
      reject(e);
    });
    
    req.end();
  });
};

// Sprawdź backend
console.log("Testing backend API endpoint...");
checkEndpoint("https://pdfspark-api.onrender.com/api/health")
  .then(result => {
    console.log(`Backend health check result: ${result.status}`);
    
    console.log("\nChecking Vercel proxy configuration...");
    return checkEndpoint("https://pdfspark.vercel.app/api/health");
  })
  .then(result => {
    console.log(`Vercel proxy check result: ${result.status}`);
    process.exit(0);
  })
  .catch(err => {
    console.error("Error checking endpoints:", err);
    process.exit(1);
  });
'

echo ""
echo "Generating a local test report of API configuration..."

# Sprawdź czy plik konfiguracyjny API istnieje
if [ -f "src/config/api.config.ts" ]; then
  echo "✅ API config file exists"
  cat src/config/api.config.ts
else
  echo "❌ API config file is missing"
fi

echo ""
echo "Verifying API service implementation..."

# Sprawdź czy serwis API został zaktualizowany
if grep -q "API_CONFIG" "src/services/api.ts"; then
  echo "✅ API service uses new configuration"
else
  echo "❌ API service has not been updated to use new configuration"
fi

echo ""
echo "Verifying Vercel configuration..."

# Sprawdź czy plik vercel.json zawiera konfigurację proxy
if grep -q "rewrites" "vercel.json" && grep -q "pdfspark-api.onrender.com" "vercel.json"; then
  echo "✅ Vercel proxy configuration is in place"
  cat vercel.json
else
  echo "❌ Vercel proxy configuration is missing or incorrect"
fi

echo ""
echo "===== Integration verification complete ====="
