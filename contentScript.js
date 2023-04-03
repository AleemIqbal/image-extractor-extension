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
  } else if (request.message === 'get_images') {
    sendResponse({ imageData: extractImages() });
  }
});