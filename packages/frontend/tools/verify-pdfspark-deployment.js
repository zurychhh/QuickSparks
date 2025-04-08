// Test-deployment.js
// Skrypt do uruchomienia w przeglądarce (DevTools Console) aby sprawdzić poprawność wdrożenia

(function() {
  console.log('🔍 Starting PDFSpark subdirectory deployment test...');

  // 1. Check base configuration
  console.log('📋 Test 1: Checking base path configuration');

  const baseHref = document.querySelector('base')?.getAttribute('href');
  console.log(`- Base href attribute: ${baseHref || 'MISSING'}`);
  if (baseHref === '/pdfspark/' || baseHref === '/pdfspark') {
    console.log('✅ Base href is correct');
  } else {
    console.warn('⚠️ Base href is incorrect or missing. Should be: /pdfspark/');
  }

  // 2. Check asset paths
  console.log('\n📋 Test 2: Checking asset paths');

  const scripts = document.querySelectorAll('script');
  const styles = document.querySelectorAll('link[rel="stylesheet"]');
  const images = document.querySelectorAll('img');

  let scriptsOk = true;
  let stylesOk = true;
  let imagesOk = true;

  scripts.forEach(script => {
    const src = script.getAttribute('src');
    if (src && !src.startsWith('/pdfspark/') && !src.startsWith('https://') && !src.startsWith('http://')) {
      console.warn(`⚠️ Incorrect script path: ${src}`);
      scriptsOk = false;
    }
  });

  styles.forEach(style => {
    const href = style.getAttribute('href');
    if (href && !href.startsWith('/pdfspark/') && !href.startsWith('https://') && !href.startsWith('http://')) {
      console.warn(`⚠️ Incorrect style path: ${href}`);
      stylesOk = false;
    }
  });

  images.forEach(img => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('/pdfspark/') && !src.startsWith('https://') && !src.startsWith('http://') && !src.startsWith('data:')) {
      console.warn(`⚠️ Incorrect image path: ${src}`);
      imagesOk = false;
    }
  });

  if (scriptsOk) console.log('✅ Script paths ok');
  if (stylesOk) console.log('✅ Style paths ok');
  if (imagesOk) console.log('✅ Image paths ok');

  // 3. Check React routing
  console.log('\n📋 Test 3: Checking routing configuration');

  // Check if basename is correctly set in BrowserRouter
  // This is an indirect test - we check if resources load with the correct path
  // and if navigation works correctly

  console.log(`- Current path: ${window.location.pathname}`);
  if (window.location.pathname.startsWith('/pdfspark')) {
    console.log('✅ URL path contains /pdfspark');
  } else {
    console.warn('⚠️ URL path does not contain /pdfspark');
  }

  // 4. Summary
  console.log('\n📋 Test Summary:');
  if (baseHref === '/pdfspark/' && scriptsOk && stylesOk && imagesOk && window.location.pathname.startsWith('/pdfspark')) {
    console.log('✅ All tests passed! Deployment appears to be correct.');
  } else {
    console.warn('⚠️ Some tests failed. Check details above and make appropriate corrections.');
  }

  console.log('\n💡 Tip: Also check if refreshing the page (F5) on subpages like /pdfspark/about does not result in a 404 error.');
})();