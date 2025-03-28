
// HashRouter monitoring script
window.addEventListener('DOMContentLoaded', function() {
  // Get the React app container
  var root = document.getElementById('root');
  if (!root) return;
  
  // Add a small indicator to show we're in HashRouter mode
  var pathNote = document.createElement('div');
  pathNote.style.position = 'fixed';
  pathNote.style.bottom = '5px';
  pathNote.style.right = '5px';
  pathNote.style.padding = '3px 6px';
  pathNote.style.background = 'rgba(0,0,0,0.5)';
  pathNote.style.color = 'white';
  pathNote.style.fontSize = '10px';
  pathNote.style.borderRadius = '3px';
  pathNote.style.zIndex = '9999';
  pathNote.textContent = 'HashRouter mode';
  
  document.body.appendChild(pathNote);
  
  // Log navigation to help with debugging
  window.addEventListener('hashchange', function() {
    console.log('Navigation to: ' + window.location.hash);
  });
});
