document.addEventListener('DOMContentLoaded', function() {
  const overlay = document.createElement('div');
  overlay.className = 'image-lightbox-overlay';
  overlay.innerHTML = `
    <button class="image-lightbox-close" aria-label="Close">&times;</button>
    <img class="image-lightbox-content" alt="Zoomed image" />
  `;
  document.body.appendChild(overlay);

  const content = overlay.querySelector('.image-lightbox-content');
  const closeBtn = overlay.querySelector('.image-lightbox-close');

  function openLightbox(src, alt) {
    content.src = src;
    content.alt = alt || 'Zoomed image';
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', function(e) {
    const img = e.target.closest('.markdown img');
    if (img && !overlay.classList.contains('active')) {
      e.preventDefault();
      openLightbox(img.src, img.alt);
    }
  });

  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeLightbox();
    }
  });
});
