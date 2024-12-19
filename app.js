document.addEventListener("DOMContentLoaded", function () {
    const scannerModal = document.getElementById("qrModal");
    const scanButton = document.getElementById("scan_button");
    const pickupButton = document.getElementById("pickup_button");
    const guideScanner = document.getElementById("guide-scanner");
    const interactive = document.getElementById("interactive");
    const closeButton = document.querySelector(".modal-header .btn-close");
    const resultElement = document.querySelector(".pickup-result");

    let scannedCode = null;
    let userCoordinates = null;
    let videoStream = null;
    let scanner = null;

            alert("Update N0. 1");


    const bsModal = new bootstrap.Modal(scannerModal, {
        keyboard: false,
        backdrop: "",
      });

    const beepSound = new Audio("beep.mp3");

    // Start the scan with optimizations for performance
    function startScan() {
        resultElement.style.display = "none";
        async function getEnvironmentCamera() {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(
                (device) => device.kind === "videoinput"
            );

            const environmentCamera = videoDevices.find(
                (device) =>
                    device.label.toLowerCase().includes("back") ||
                    device.label.toLowerCase().includes("rear")
            );

            return environmentCamera ? environmentCamera.deviceId : undefined;
        }

        getEnvironmentCamera().then((cameraId) => {
            // Optimizing Quagga initialization with lower resolution and faster frequency
            Quagga.init(
                {
                    inputStream: {
                        name: "Live",
                        type: "LiveStream",
                        target: interactive,
                        constraints: {
                            width: 320, // Reduced width for faster processing
                            height: 240, // Reduced height for faster processing
                            deviceId: cameraId || undefined,
                            facingMode: { ideal: "environment" },
                        },
                    },
                    decoder: { readers: ["code_39_reader"] },
                    locate: true,
                    locator: { patchSize: "small", halfSample: true }, // Reduced patch size for speed
                    numOfWorkers: 2, // Using fewer workers to speed up processing
                    frequency: 30, // Increased frequency to speed up detection
                    debug: false, // Disable debugging for better performance
                },
                function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    console.log("QuaggaJS initialized successfully.");
                    Quagga.start();
                }
            );

            Quagga.onProcessed(function () {
                const videoElement = document.querySelector("video");
                if (videoElement && videoElement.readyState === 4) {
                    guideScanner.style.display = "block";
                }
            });

            Quagga.onDetected(function (data) {
                        alert("Detected barcode: " + result.codeResult.code);

                // scannedCode = data.codeResult.code;
                // guideScanner.style.display = "none";
                // resultElement.style.display = "block";
                // document.getElementById("result").innerText = `Code: ${scannedCode}`;

                // beepSound
                //     .play()
                //     .then(() => {
                //         Quagga.stop();
                //         stopScan();
                //         removeVideoElement();
                //         checkPackageStatus(scannedCode);
                //     })
                //     .catch((error) => {
                //         console.error("Error playing beep sound:", error);
                //         Quagga.stop();
                //         stopScan();
                //         removeVideoElement();
                //         checkPackageStatus(scannedCode);
                //     });
            });
        });
    }

    // Stop the scanner
    function stopScan() {
        if (videoStream) {
            const tracks = videoStream.getTracks();
            tracks.forEach(function (track) {
                track.stop();
            });
            videoStream = null;
        }
    }

    // Remove the video element from the DOM
    function removeVideoElement() {
        const video = document.getElementById("video");
        if (video) {
            video.remove();
        }
    }

    // Remove canvas elements (used for Quagga's visualization)
    function removeCanvasElements() {
        const canvases = document.querySelectorAll(".drawingBuffer");
        canvases.forEach((canvas) => {
            canvas.parentNode.removeChild(canvas);
        });
    }

    // Function to get address from coordinates
    function getAddressFromCoordinates(lat, lon, callback) {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                if (data && data.display_name) {
                    callback(data.display_name);
                } else {
                    callback(null);
                }
            })
            .catch((error) => {
                console.error("Error fetching address:", error);
                callback(null);
            });
    }

    // Check package status
    function checkPackageStatus(code) {
        $.ajax({
            url: "liste.php", // Change the path to your PHP file if necessary
            type: "POST",
            data: {
                code: code,
                check_status: 1,
            },
            dataType: "json",
            success: function (response) {
                if (response && response.existe) {
                    pickupButton.classList.add("d-none");
                    removeDeliveredButtons();
                    const deliveredButton = document.createElement("button");
                    deliveredButton.innerText = "Livré";
                    deliveredButton.classList.add("btn", "btn-primary");
                    deliveredButton.addEventListener("click", function () {
                        saveStatusLivree();
                    });
                    scannerModal
                        .querySelector(".modal-footer")
                        .appendChild(deliveredButton);
                } else {
                    pickupButton.classList.remove("d-none");
                }
            },
            error: function () {
                alert("Erreur lors de la vérification du statut du colis.");
            },
        });
    }

    // Remove delivered buttons
    function removeDeliveredButtons() {
        const deliveredButtons = scannerModal.querySelectorAll(
            ".modal-footer button.btn-primary"
        );
        deliveredButtons.forEach((button) => {
            button.remove();
        });
    }

    // Save scan result (pickup)
    function saveScanResult() {
        if (!scannedCode || !userCoordinates) {
            alert("Scan incomplet ou coordonnées manquantes");
            return;
        }

        if (confirm("Êtes-vous sûr de vouloir marquer le colis comme ramassé ?")) {
            getAddressFromCoordinates(
                userCoordinates.lat,
                userCoordinates.lon,
                (address) => {
                    if (!address) {
                        alert("Impossible de récupérer l'adresse");
                        return;
                    }

                    const data = {
                        code: scannedCode,
                        address: address,
                        marquer_ramasser: 1,
                    };

                    $.ajax({
                        url: "liste.php",
                        type: "POST",
                        data: data,
                        dataType: "json",
                        success: function (response) {
                            if (response) {
                                alert(response.message);
                                location.reload();
                            } else {
                                alert("Réponse invalide du serveur.");
                            }
                        },
                        error: function () {
                            alert("Erreur lors de la sauvegarde.");
                        },
                    });
                }
            );
        } else {
            console.log("L'opération a été annulée.");
        }
    }

    // Handle modal show event
    scannerModal.addEventListener("shown.bs.modal", function () {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userCoordinates = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                };
                if (!document.getElementById("video")) {
                    const videoElement = document.createElement("video");
                    videoElement.setAttribute("id", "video");
                    videoElement.setAttribute("playsinline", "");
                    videoElement.setAttribute("muted", "");
                    videoElement.style.width = "100%";
                    interactive.appendChild(videoElement);

                    navigator.mediaDevices
                        .getUserMedia({ video: { facingMode: "environment" } })
                        .then(function (stream) {
                            videoStream = stream;
                            videoElement.srcObject = stream;
                            videoElement.play();
                            startScan();
                        })
                        .catch(function (err) {
                            console.error("Error accessing camera:", err);
                            alert("Impossible d'accéder à la caméra");
                        });
                } else {
                    startScan();
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert("Impossible d'obtenir la position de l'utilisateur");
            }
        );
    });

    // Handle modal hide event
    scannerModal.addEventListener("hidden.bs.modal", function () {
        stopScan();
        removeVideoElement(); // Ensure video element is removed when modal is hidden
        removeCanvasElements(); // Ensure canvas elements are removed
        location.reload();
    });

    // Bind event listeners
    scanButton.addEventListener("click", () => bsModal.show());
    // pickupButton.addEventListener("click", saveScanResult);
    closeButton.addEventListener("click", function () {
        stopScan();
        location.reload();
    });
});
