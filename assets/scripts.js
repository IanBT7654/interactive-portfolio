// assets/scripts.js

import { supabaseClient } from './config.js';

// Now you can use supabaseClient directly
async function testConnection() {
  const { data, error } = await supabaseClient.from('blog_posts').select('*');
  if (error) {
    console.error('❌ Supabase Error:', error);
  } else {
    console.log('✅ Supabase Connected. Posts:', data);
  }
}
testConnection();

const imageUpload = document.getElementById('imageUpload');
const selectedImage = document.getElementById('selectedImage');
const croppedCanvas = document.getElementById('croppedPreview');
const captionInput = document.getElementById('caption');
const captionContainer = document.getElementById('captionInputContainer');
const makeBlogBtn = document.getElementById('makeBlogBtn');
const submitBlogBtn = document.getElementById('submitBlogBtn');
const blogPreview = document.getElementById('blogPostPreview');

let cropper = null;
let originalFileName = '';

function loadAndCropImage(file) {
  const reader = new FileReader();
  reader.onload = () => {
    selectedImage.src = reader.result;
    selectedImage.classList.remove('hidden');

    if (cropper) cropper.destroy();

    cropper = new Cropper(selectedImage, {
      aspectRatio: 1280 / 853,
      viewMode: 1,
      autoCropArea: 1,
      responsive: true,
    });
  };
  reader.readAsDataURL(file);
}

imageUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    originalFileName = file.name;
    loadAndCropImage(file);
  }
});

makeBlogBtn.addEventListener('click', () => {
  if (!cropper) {
    alert('Please select or upload an image first.');
    return;
  }
  captionContainer.classList.remove('hidden');
});

submitBlogBtn.addEventListener('click', async () => {
  const caption = captionInput.value.trim();

  if (!caption) return alert('Caption is required.');
  if (containsNaughtyWords(caption)) return alert('⚠️ Caption contains restricted words.');

  const blob = await new Promise((resolve) => {
    croppedCanvas.getContext('2d').clearRect(0, 0, croppedCanvas.width, croppedCanvas.height);
    const croppedCanvasTemp = cropper.getCroppedCanvas({ width: 1280, height: 853 });
    croppedCanvas.getContext('2d').drawImage(croppedCanvasTemp, 0, 0);

    croppedCanvasTemp.toBlob(resolve, 'image/jpeg');
  });

  const uniqueFilename = `blog-${Date.now()}.jpg`;

  const { data: storageData, error: storageError } = await supabaseClient.storage
    .from('blog-images')
    .upload(uniqueFilename, blob, { contentType: 'image/jpeg' });

  if (storageError) {
    console.error('❌ Upload Error:', storageError.message);
    alert('Upload failed.');
    return;
  }

  const imageUrl = supabaseClient.storage
    .from('blog-images')
    .getPublicUrl(uniqueFilename).data.publicUrl;

  const { error: insertError } = await supabaseClient
    .from('blog_posts')
    .insert([{ image_url: imageUrl, caption }]);

  if (insertError) {
    console.error('❌ DB Error:', insertError.message);
    alert('Database insert failed.');
    return;
  }

  // Display result
  blogPreview.innerHTML = `
    <div class="text-center">
      <img src="${imageUrl}" class="mx-auto max-h-48 rounded mb-2" />
      <p class="text-sm text-gray-700">${caption}</p>
    </div>
  `;
  alert('✅ Blog post saved!');
  captionInput.value = '';
  captionContainer.classList.add('hidden');
});

function containsNaughtyWords(text) {
  const blacklist = ['badword1', 'badword2', 'http', 'https', 'www', '<script', 'onerror'];
  const lower = text.toLowerCase();
  return blacklist.some(word => lower.includes(word));
}


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