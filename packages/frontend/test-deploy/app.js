console.log('JavaScript is loading correctly!');
document.addEventListener('DOMContentLoaded', () => {
  const message = document.createElement('p');
  message.textContent = 'JavaScript executed successfully!';
  message.style.color = 'green';
  document.querySelector('.container').appendChild(message);
});
