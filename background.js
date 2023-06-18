let imageDataCache = {};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'store_images') {
    const filteredImageData = request.imageData.filter((img) => !img.src.endsWith('.svg') && !img.src.startsWith('data:image/svg+xml'));
    imageDataCache[sender.tab.id] = filteredImageData;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    delete imageDataCache[tabId];
  }
});

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    if (msg.message === 'get_images') {
      const tabId = msg.tabId;
      if (imageDataCache.hasOwnProperty(tabId)) {
        port.postMessage({ message: 'image_data', imageData: imageDataCache[tabId] });
      } else {
        chrome.tabs.sendMessage(tabId, { message: 'extract_images' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
          } else if (response && response.imageData) {
            imageDataCache[tabId] = response.imageData;
            port.postMessage({ message: 'image_data', imageData: response.imageData });
          } else {
            console.error('Unexpected response:', response);
          }
        });
      }
    }
  });
});
