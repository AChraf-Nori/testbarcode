// Set up the canvas for image manipulation
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Video stream element
const video = document.createElement('video');

// Function to initialize the video stream and start the barcode scanner
function initializeScanner() {
    // Set up Quagga to use the live camera stream
    Quagga.init({
        inputStream: {
            name: 'Live',
            type: 'LiveStream',
            target: document.querySelector('#scanner-container'), // target the container where the video stream will appear
            constraints: {
                facingMode: 'environment', // Use the rear camera on mobile devices
            },
            area: {
                top: '10%',    // top offset to focus on the center
                right: '10%',
                left: '10%',
                bottom: '10%'   // bottom offset for a better capture area
            },
        },
        decoder: {
            readers: ['code_128_reader', 'ean_reader', 'upc_reader', 'code_39_reader'] // 1D barcodes
        }
    }, function(err) {
        if (err) {
            console.error('Error initializing Quagga:', err);
            return;
        }
        console.log('Quagga initialized successfully');
        // Start the scanning process
        Quagga.start();
    });

    // When a barcode is detected, handle it
    Quagga.onDetected(function(result) {
        const barcode = result.codeResult.code; // the detected barcode value
        document.getElementById('barcode-result').innerText = 'Barcode: ' + barcode;
        console.log('Barcode detected:', barcode);
    });

    // Set up video streaming
    video.width = 640; // You can set the width and height according to your needs
    video.height = 480;

    // Start the video stream
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(function(stream) {
            video.srcObject = stream;
            video.play();
            requestAnimationFrame(processFrame);
        })
        .catch(function(error) {
            console.error('Error accessing camera:', error);
        });
}

// Function to process each video frame using Canvas
function processFrame() {
    // Draw the current video frame onto the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // You can optionally process the frame here (resize, grayscale, etc.) to improve detection speed and accuracy
    // Example: Resize the image for faster processing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Send the image data to Quagga for barcode detection
    Quagga.decodeSingle({
        src: imageData,
        decoder: {
            readers: ['code_128_reader', 'ean_reader', 'upc_reader', 'code_39_reader']
        }
    }, function(result) {
        if (result && result.codeResult) {
            console.log('Barcode detected:', result.codeResult.code);
            document.getElementById('barcode-result').innerText = 'Barcode: ' + result.codeResult.code;
        }
    });

    // Request the next animation frame
    requestAnimationFrame(processFrame);
}

// Initialize the scanner
initializeScanner();
