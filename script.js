const upload = document.getElementById("upload");
const image = document.getElementById("image");
const cropButton = document.getElementById("crop");
const idSizeSelect = document.getElementById("id-size");
const dpiInput = document.getElementById("dpi");
const printCanvas = document.getElementById("print-layout");
const printSizeSelect = document.getElementById("print-size");
const downloadPNG = document.getElementById("download-png");
const downloadJPG = document.getElementById("download-jpg");

let cropper;
let idWidth, idHeight;

// ** Function to update the aspect ratio based on the selected ID size **
function updateAspectRatio() {
    const idSize = idSizeSelect.value.split("x");
    idWidth = parseFloat(idSize[0]);
    idHeight = parseFloat(idSize[1]);

    if (cropper) {
        cropper.setAspectRatio(idWidth / idHeight);
    }
}

function arrangePhotosOnCanvas(croppedImage, idPhotoWidth, idPhotoHeight, printWidth, printHeight, dpi) {
    const borderSize = Math.round((5 / 25.4) * dpi); // Convert 5mm to pixels

    // Create a canvas for the 4x6 inch print size
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const canvasWidth = Math.round(printWidth * dpi);
    const canvasHeight = Math.round(printHeight * dpi);
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Fill the entire canvas with white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Calculate how many ID photos fit in rows and columns with borders
    const totalWidth = idPhotoWidth + borderSize;
    const totalHeight = idPhotoHeight + borderSize;

    const cols = Math.floor(canvasWidth / totalWidth);
    const rows = Math.floor(canvasHeight / totalHeight);

    const startX = (canvasWidth - cols * totalWidth + borderSize) / 2; // Center images
    const startY = (canvasHeight - rows * totalHeight + borderSize) / 2;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = startX + col * totalWidth;
            const y = startY + row * totalHeight;

            // Draw cropped ID photo with space for white border
            ctx.drawImage(croppedImage, x, y, idPhotoWidth, idPhotoHeight);
        }
    }

    return canvas;
}


// ** Initialize Cropper.js when user uploads an image **
upload.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        image.src = e.target.result;

        if (cropper) {
            cropper.destroy();
        }

        cropper = new Cropper(image, {
            aspectRatio: idWidth / idHeight,
            viewMode: 1,
        });
    };
    reader.readAsDataURL(file);
});

// ** Update aspect ratio when ID size is changed **
idSizeSelect.addEventListener("change", updateAspectRatio);

// ** Function to generate a printable layout **
cropButton.addEventListener("click", function () {
    if (!cropper) return;

    const dpi = parseInt(dpiInput.value);
    const cmToInch = 2.54;

    // Convert ID photo size to pixels
    const idWidthPx = Math.round((idWidth / cmToInch) * dpi);
    const idHeightPx = Math.round((idHeight / cmToInch) * dpi);

    // Crop the image
    const croppedCanvas = cropper.getCroppedCanvas({
        width: idWidthPx,
        height: idHeightPx,
    });

    // Get print paper size
    let paperWidthInches, paperHeightInches;
    switch (printSizeSelect.value) {
        case "4x6":
            paperWidthInches = 4;
            paperHeightInches = 6;
            break;
        case "5x7":
            paperWidthInches = 5;
            paperHeightInches = 7;
            break;
        case "A4":
            paperWidthInches = 8.27;
            paperHeightInches = 11.69;
            break;
    }

    const paperWidthPx = Math.round(paperWidthInches * dpi);
    const paperHeightPx = Math.round(paperHeightInches * dpi);

    const borderSize = Math.round((5 / 25.4) * dpi); // Convert 5mm to pixels

    // Prepare the print canvas
    printCanvas.width = paperWidthPx;
    printCanvas.height = paperHeightPx;
    const ctx = printCanvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, paperWidthPx, paperHeightPx);

    // Arrange ID photos on the canvas
    let x = borderSize, y = borderSize;
    while (y + idHeightPx <= paperHeightPx) {
        ctx.drawImage(croppedCanvas, x, y, idWidthPx, idHeightPx);
        x += idWidthPx+borderSize;
        if (x + idWidthPx > paperWidthPx) {
            x = 0;
            y += idHeightPx๙borderSize;
        }
    }
});

// ** Function to download the generated image as PNG or JPG **
function downloadImage(format) {
    const link = document.createElement("a");
    link.download = `id-photo-layout.${format}`;
    
    if (format === "jpg") {
        link.href = printCanvas.toDataURL("image/jpeg", 0.9); // 90% quality
    } else {
        link.href = printCanvas.toDataURL("image/png");
    }

    link.click();
}

// ** Attach download event listeners **
downloadPNG.addEventListener("click", () => downloadImage("png"));
downloadJPG.addEventListener("click", () => downloadImage("jpg"));

// ** Initialize aspect ratio when page loads **
updateAspectRatio();
