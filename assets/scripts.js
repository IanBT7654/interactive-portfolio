// assets/scripts.js

document.addEventListener("DOMContentLoaded", () => {
  const imagePlaceholder = document.getElementById("imagePlaceholder");
  const blogPostPreview = document.getElementById("blogPostPreview");
  const captionBox = document.getElementById("captionInputContainer");

  // Handle sample image clicks
  document.querySelectorAll(".sample-img").forEach(img => {
    img.addEventListener("click", () => {
      loadImageToPlaceholder(img.src);
    });
  });

  // Handle image upload
  document.getElementById("imageUpload").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
      loadImageToPlaceholder(event.target.result);
    };
    reader.readAsDataURL(file);
  });

  // Function to load image
  let cropper;

function loadImageToPlaceholder(src) {
  const imageEl = document.getElementById("selectedImage");
  imageEl.src = src;
  imageEl.classList.remove("hidden");

  // Destroy old cropper if it exists
  if (cropper) {
    cropper.destroy();
  }

  // Wait until image loads
  imageEl.onload = () => {
    cropper = new Cropper(imageEl, {
      aspectRatio: 1280 / 853,
      viewMode: 1,
      autoCropArea: 1,
      responsive: true,
      zoomable: false,
      movable: true,
      crop(event) {
        const canvas = document.getElementById("croppedPreview");
        const croppedCanvas = cropper.getCroppedCanvas({
          width: 1280,
          height: 853,
        });
        const ctx = canvas.getContext("2d");
        canvas.width = 320;
        canvas.height = 213;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(croppedCanvas, 0, 0, canvas.width, canvas.height);
      }
    });
  };
}


  // Show caption input
  document.getElementById("makeBlogBtn").addEventListener("click", () => {
    captionBox.classList.remove("hidden");
  });
});

console.log("Interactive Portfolio scripts loaded.");