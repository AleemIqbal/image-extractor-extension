chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'extract_images') {
    const images = document.querySelectorAll('img');
    let imageData = Array.from(images)
      .map((img) => {
        const src = img.dataset.src || img.src; // Use the data-src attribute if available
        if (isValidImageUrl(src)) {
          return {
            src,
            name: src.split('/').pop(),
            alt: img.alt || 'N/A',
          };
        }
      })
      .filter(Boolean);

    // Get all elements with a background image
    const elements = document.querySelectorAll('*');
    let backgroundImages = Array.from(elements).reduce((data, el) => {
      const style = window.getComputedStyle(el);
      if (style.backgroundImage !== 'none') {
        const url = style.backgroundImage.slice(5, -2); // remove url("") surrounding the URL
        if (isValidImageUrl(url)) {
          data.push({
            src: url,
            name: url.split('/').pop(),
            alt: 'N/A',
          });
        }
      }
      return data;
    }, []);

    const allImages = [...imageData, ...backgroundImages];

    // Create a set of unique image URLs
    const uniqueUrls = new Set(allImages.map((img) => img.src));

    // Filter out duplicate images
    const uniqueImages = Array.from(uniqueUrls).map((url) => allImages.find((img) => img.src === url));

    sendResponse({ imageData: uniqueImages });
  } else if (request.message === 'scroll_to_image') {
    scrollToLazyLoadedImage(request.src);
  }
});

// Checks if the given URL points to a valid image
function isValidImageUrl(url) {
  const extensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
  const extension = url.split('.').pop().split('?')[0].toLowerCase();
  return extensions.includes(extension) && !url.endsWith('.svg') && !url.startsWith('data:image/svg+xml');
}

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
