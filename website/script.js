//Example:  Simple image gallery lightbox (requires images)

const galleryImages = document.querySelectorAll('.gallery-container img');

galleryImages.forEach(image => {
  image.addEventListener('click', () => {
    //  Basic lightbox functionality - replace with a more robust solution for production.
    const lightbox = document.createElement('div');
    lightbox.style.position = 'fixed';
    lightbox.style.top = '0';
    lightbox.style.left = '0';
    lightbox.style.width = '100%';
    lightbox.style.height = '100%';
    lightbox.style.backgroundColor = 'rgba(0,0,0,0.8)';
    lightbox.style.display = 'flex';
    lightbox.style.justifyContent = 'center';
    lightbox.style.alignItems = 'center';

    const img = document.createElement('img');
    img.src = image.src;
    img.style.maxWidth = '80%';
    img.style.maxHeight = '80%';

    lightbox.appendChild(img);
    document.body.appendChild(lightbox);

    lightbox.addEventListener('click', () => {
      document.body.removeChild(lightbox);
    });
  });
});

