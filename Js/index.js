document.querySelectorAll('.document-card').forEach(card => {
  card.addEventListener('click', e => {
    e.preventDefault();
    card.classList.toggle('active');
  });
});
