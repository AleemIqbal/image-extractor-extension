function scrollToImage(imgElement) {
  imgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  imgElement.style.border = '2px solid #4CAF50';
  setTimeout(() => {
    imgElement.style.border = '';
  }, 2000);
}
document.getElementById('downloadAllButton').addEventListener('click', async () => {
    const zip = new JSZip();
    const imageList = document.getElementById('imageList').children;
    let imageCount = 0;

    for (const li of imageList) {
        const imageUrl = li.querySelector('.imageItem').title;
        const imageName = li.querySelector('.imageItem').textContent.replace(/\?.*/, '');
        try {
            const response = await fetch(imageUrl);
            const data = await response.blob();
            zip.file(imageName, data);
            imageCount++;
        } catch (error) {
            console.error('Failed to fetch image', imageUrl, error);
        }
    }

    if (imageCount === 0) {
        alert('No images found to download.');
        return;
    }

    zip.generateAsync({ type: 'blob' }).then((blob) => {
        saveAs(blob, 'images.zip');
    });
});

const port = chrome.runtime.connect({ name: 'popup' });

port.onMessage.addListener((msg) => {
    if (msg.message === 'image_data') {
        const imageList = document.getElementById('imageList');
        imageList.innerHTML = '';
        document.getElementById('downloadAllButton').style.display = 'inline-block';

        msg.imageData.forEach((img) => {
            const li = document.createElement('li');

            const imgPreview = document.createElement('img');
            imgPreview.src = img.src;
            imgPreview.classList.add('imagePreview');

            const imgName = document.createElement('div');
            imgName.textContent = img.name.replace(/\?.*/, '');
            imgName.title = img.src;
            imgName.classList.add('imageItem');
            imgName.addEventListener('click', () => {
                navigator.clipboard.writeText(img.name.replace(/\?.*/, '')).then(() => {
                    console.log('Image file name copied to clipboard');
                }, (error) => {
                    console.error('Failed to copy image file name', error);
                });
            });

            const altText = document.createElement('div');
            altText.textContent = `Alt: ${img.alt}`;
            altText.classList.add('altText');

            const infoContainer = document.createElement('div');
            infoContainer.classList.add('infoContainer');
            infoContainer.appendChild(imgName);
            infoContainer.appendChild(altText);

            const downloadIcon = document.createElement('span');
            downloadIcon.classList.add('downloadIcon');
            downloadIcon.textContent = '⬇️';
            downloadIcon.title = 'Download image';
            downloadIcon.addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = img.src;
                link.download = img.name.replace(/\?.*/, '');
                link.click();
            });

            const copyIcon = document.createElement('span');
            copyIcon.classList.add('copyIcon');
            copyIcon.textContent = '📋';
            copyIcon.title = 'Copy image URL';
            copyIcon.addEventListener('click', () => {
                navigator.clipboard.writeText(img.src).then(() => {
                    console.log('Image URL copied to clipboard');
                }, (error) => {
                    console.error('Failed to copy image URL', error);
                });
            });
			
			const scrollToIcon = document.createElement('span');
			scrollToIcon.classList.add('scrollToIcon');
			scrollToIcon.textContent = '🔎';
			scrollToIcon.title = 'Scroll to image';
			scrollToIcon.addEventListener('click', () => {
				chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
					chrome.tabs.sendMessage(tabs[0].id, { message: 'scroll_to_image', src: img.src });
				});
			});

            const iconContainer = document.createElement('div');
            iconContainer.classList.add('iconContainer');
            iconContainer.appendChild(downloadIcon);
			iconContainer.appendChild(copyIcon);
			iconContainer.appendChild(scrollToIcon);

            li.appendChild(imgPreview);
            li.appendChild(infoContainer);
            li.appendChild(iconContainer);
            imageList.appendChild(li);
        });
    }
});
port.onDisconnect.addListener(() => {
    console.log('Port disconnected');
});


chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    setTimeout(() => {
        port.postMessage({ message: 'get_images', tabId: tabs[0].id });
    }, 100);
});