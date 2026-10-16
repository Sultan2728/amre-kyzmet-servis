document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".document-card");

  cards.forEach(card => {
    card.addEventListener("click", e => {
      e.preventDefault();

      // закрываем другие карточки
      cards.forEach(c => {
        if (c !== card) c.classList.remove("active");
      });

      // переключаем текущую
      card.classList.toggle("active");
    });
  });
});
