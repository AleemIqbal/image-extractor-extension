chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'extract_images') {
    const images = document.querySelectorAll('img:not([src*=".svg"])');
    const imageData = Array.from(images).map((img) => {
      const src = img.dataset.src || img.src; // Use the data-src attribute if available
      return {
        src,
        name: src.split('/').pop(),
        alt: img.alt || 'N/A',
      };
    });
    sendResponse({ imageData });
  } else if (request.message === 'scroll_to_image') {
    scrollToLazyLoadedImage(request.src);
  }
});

function highlightImage(image) {
  image.style.border = '2px solid #4CAF50';
  image.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => {
    image.style.border = '';
  }, 2000);
}

function scrollToLazyLoadedImage(src) {
  const image = document.querySelector(`img[data-src="${src}"], img[src="${src}"]`);
  if (image) {
    if (image.complete) {
      highlightImage(image);
    } else {
      const observer = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              observer.disconnect();
              image.onload = () => {
                highlightImage(image);
              };
            }
          });
        },
        { threshold: 1.0 }
      );

      observer.observe(image);
      image.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } else {
    console.error('Image not found on the page');
  }
}
