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

function logDebugMessage(message) {
    const debugConsole = document.getElementById("debugConsole");
    debugConsole.innerText += message + "\n"; // Append messages
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

    let paperWidthPx = Math.round(paperWidthInches * dpi);
    let paperHeightPx = Math.round(paperHeightInches * dpi);

    const borderSize = Math.round((3 / 25.4) * dpi); // Convert 3mm to pixels

    a1 = Math.floor(paperHeightPx / (idHeightPx + borderSize))
    b1 = Math.floor(paperWidthPx / (idWidthPx + borderSize))
    num1 = a1 * b1
    a2 = Math.floor(paperWidthPx / (idHeightPx + borderSize))
    b2 = Math.floor(paperHeightPx / (idWidthPx + borderSize))
    num2 = a2 * b2

    logDebugMessage(`${a1} ${b1} ${num1} VS ${a2} ${b2} ${num2}`);

    if (num2 > num1) {
        let tmp = paperWidthPx;
        paperWidthPx = paperHeightPx;
        paperHeightPx = tmp;
    }


    // Prepare the print canvas
    printCanvas.width = paperWidthPx;
    printCanvas.height = paperHeightPx;

    const ctx = printCanvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, paperWidthPx, paperHeightPx);

    // Arrange ID photos on the canvas
    let x = borderSize, y = borderSize;
    while (y + idHeightPx <= paperHeightPx) {
        logDebugMessage(`${x} ${y}`);
        ctx.drawImage(croppedCanvas, x, y, idWidthPx, idHeightPx);
        x += idWidthPx+borderSize;
        if (x + idWidthPx > paperWidthPx) {
            x = borderSize;
            y += idHeightPx+borderSize;
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
