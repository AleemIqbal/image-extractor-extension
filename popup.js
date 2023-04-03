document.getElementById('downloadAllButton').addEventListener('click', async () => {
    const zip = new JSZip();
    const imageList = document.getElementById('imageList').children;
    let imageCount = 0;

    for (const li of imageList) {
        const imageUrl = li.querySelector('.imageItem').title;
        const imageName = li.querySelector('.imageItem').textContent;
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
            imgName.textContent = img.name;
            imgName.title = img.src;
            imgName.classList.add('imageItem');

            const altText = document.createElement('div');
            altText.textContent = `Alt: ${img.alt}`;
            altText.classList.add('altText');

            const downloadIcon = document.createElement('span');
            downloadIcon.classList.add('downloadIcon');
            downloadIcon.textContent = '⬇️';
            downloadIcon.title = 'Download image';
            downloadIcon.addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = img.src;
                link.download = img.name;
                link.click();
            });

            li.appendChild(imgPreview);
            li.appendChild(imgName);
            li.appendChild(altText);
            li.appendChild(downloadIcon);
            imageList.appendChild(li);

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

            li.appendChild(copyIcon);
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