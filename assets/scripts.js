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
  function loadImageToPlaceholder(src) {
    imagePlaceholder.innerHTML = `<img src="${src}" alt="Selected Image">`;
  }

  // Show caption input
  document.getElementById("makeBlogBtn").addEventListener("click", () => {
    captionBox.classList.remove("hidden");
  });
});

console.log("Interactive Portfolio scripts loaded.");