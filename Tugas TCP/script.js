document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('gambar');
    const outputCanvas = document.getElementById('outputCanvas');
    const ctx = outputCanvas.getContext('2d');
    const brightnessRange = document.getElementById('brightnessRange');
    const darknessRange = document.getElementById('darknessRange');
    const downloadBtn = document.getElementById('downloadBtn'); // Menambahkan id pada tombol download

    let originalImageData; // Simpan data gambar asli
    let filters = {
        brightness: 100,
        darkness: 0,
        isGrayscale: false,
    };

    input.addEventListener('change', handleImageUpload);

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.src = e.target.result;
                img.onload = function () {
                    const maxWidth = 500;
                    const maxHeight = 500;

                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }

                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }

                    outputCanvas.width = width;
                    outputCanvas.height = height;

                    ctx.drawImage(img, 0, 0, width, height);
                    originalImageData = ctx.getImageData(0, 0, width, height);
                    enableButtons();
                };
            };
            reader.readAsDataURL(file);
        }
    }

    function enableButtons() {
        brightnessRange.disabled = false;
        darknessRange.disabled = false;
        downloadBtn.disabled = false; // Mengaktifkan tombol download
    }

    function adjustBrightness(value) {
        filters.brightness = value;
        document.getElementById('brightnessValue').innerText = value;
        applyFilter();
    }

    function adjustDarkness(value) {
        filters.darkness = value;
        document.getElementById('darknessValue').innerText = value;
        applyFilter();
    }

    function applyFilter() {
        updateCanvasFilter();
    }

    function updateCanvasFilter() {
        const { brightness, darkness, isGrayscale } = filters;
        outputCanvas.style.filter = `brightness(${brightness}%) contrast(${100 - darkness}%)`;

        // Apply grayscale filter if it was activated
        if (isGrayscale) {
            outputCanvas.style.filter += ' grayscale(100%)';
        }
    }

    function adjustGrayscale() {
        filters.isGrayscale = !filters.isGrayscale;
        applyFilter();
    }

    function changeOrientation(orientation) {
        outputCanvas.classList.remove('horizontal', 'vertical');
        outputCanvas.classList.toggle(orientation);
    }

    function restartImage() {
        const { width, height } = outputCanvas;
        ctx.clearRect(0, 0, width, height);
        ctx.putImageData(originalImageData, 0, 0);
        filters.brightness = 100;
        filters.darkness = 0;
        filters.isGrayscale = false;
        applyFilter();
    }

    function detectEdges() {
        const imageData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
        const grayscaleData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);

        // Ubah gambar menjadi grayscale
        for (let i = 0; i < imageData.data.length; i += 4) {
            const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
            grayscaleData.data[i] = avg;
            grayscaleData.data[i + 1] = avg;
            grayscaleData.data[i + 2] = avg;
            grayscaleData.data[i + 3] = 255;
        }

        const edgeData = applyEdgeDetection(grayscaleData); // Panggil fungsi deteksi tepi
        ctx.putImageData(edgeData, 0, 0);
    }

    // Fungsi deteksi tepi menggunakan filter Sobel
    function applyEdgeDetection(grayscaleData) {
        const sobelData = new ImageData(grayscaleData.width, grayscaleData.height);

        // Matriks Sobel untuk deteksi tepi
        const sobelMatrixX = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ];

        const sobelMatrixY = [
            [-1, -2, -1],
            [0, 0, 0],
            [1, 2, 1]
        ];

        for (let y = 1; y < grayscaleData.height - 1; y++) {
            for (let x = 1; x < grayscaleData.width - 1; x++) {
                let pixelX = 0;
                let pixelY = 0;

                // Konvolusi matriks Sobel
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        const pixelValue = grayscaleData.data[((y + j - 1) * grayscaleData.width + (x + i - 1)) * 4];
                        pixelX += pixelValue * sobelMatrixX[j][i];
                        pixelY += pixelValue * sobelMatrixY[j][i];
                    }
                }

                const magnitude = Math.sqrt(pixelX ** 2 + pixelY ** 2);
                sobelData.data[(y * grayscaleData.width + x) * 4] = magnitude;
                sobelData.data[(y * grayscaleData.width + x) * 4 + 1] = magnitude;
                sobelData.data[(y * grayscaleData.width + x) * 4 + 2] = magnitude;
                sobelData.data[(y * grayscaleData.width + x) * 4 + 3] = 255;
            }
        }

        return sobelData;
    }

    document.getElementById('brightnessRange').addEventListener('input', function () {
        adjustBrightness(this.value);
    });

    document.getElementById('darknessRange').addEventListener('input', function () {
        adjustDarkness(this.value);
    });

    document.querySelector('.btn-secondary').addEventListener('click', function () {
        adjustGrayscale();
    });

    document.querySelector('.btn-primary').addEventListener('click', function () {
        changeOrientation('horizontal');
    });

    document.querySelector('.btn-success').addEventListener('click', function () {
        changeOrientation('vertical');
    });

    document.querySelector('.btn-warning').addEventListener('click', function () {
        restartImage();
    });

    document.querySelector('.btn-custom').addEventListener('click', function () {
        detectEdges();
    });

    downloadBtn.addEventListener('click', function () {
        downloadImage();
    });

    function downloadImage() {
        const link = document.createElement('a');
        link.href = outputCanvas.toDataURL();
        link.download = 'processed_image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});
