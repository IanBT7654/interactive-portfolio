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

function loadImageToPlaceholder(src) {
  const imageEl = document.getElementById("selectedImage");
  imageEl.src = src;
  imageEl.classList.remove("hidden");

  if (cropper) cropper.destroy();

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


makeBlogBtn.addEventListener('click', () => {
  if (!cropper) {
    alert('Please select or upload an image first.');
    return;
  }
  captionContainer.classList.remove('hidden');
});

imageUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    originalFileName = file.name;

    const reader = new FileReader();
    reader.onload = (event) => {
      loadImageToPlaceholder(event.target.result);  // ✅ use unified function
    };
    reader.readAsDataURL(file);
  }
});

submitBlogBtn.addEventListener('click', async () => {
  const caption = captionInput.value.trim();

  if (!caption) return alert('Caption is required.');
  if (containsNaughtyWords(caption)) return alert('⚠️ Caption contains restricted words.');

  const blob = await new Promise((resolve) => {
    
    const croppedCanvasTemp = cropper.getCroppedCanvas({ width: 1280, height: 853 });
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
  <div class="dark bg-white dark:bg-gray-800 dark:text-gray-200 w-full h-full rounded shadow-inner p-4">
    <!-- Mini Blog Header -->
    <header class="border-b pb-3 mb-3 border-gray-300 dark:border-gray-600">
      <h1 class="text-2xl font-bold text-indigo-700 dark:text-indigo-300">automate-aig.blog</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">Automation + AIG — Interactive demos by Ian B</p>
    </header>

    <!-- Blog Article -->
    <article class="text-left">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-1">${caption}</h2>
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
        <i class="fas fa-calendar-alt mr-1"></i>${new Date().toLocaleDateString()} &nbsp;•&nbsp;
        <i class="fas fa-user mr-1"></i> Ian B
      </p>
      <img src="${imageUrl}" alt="Blog Image" class="w-full rounded mb-3 max-h-40 object-cover border dark:border-gray-600" />
      <p class="text-sm text-gray-700 dark:text-gray-300 leading-snug">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur blandit tempus porttitor.
        Praesent commodo cursus magna, vel scelerisque nisl consectetur et.
      </p>
    </article>
  </div>
`;

  // ✅ Now we’re *outside* the template string
  captionInput.value = '';
  captionContainer.classList.add('hidden');
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
  


  // Show caption input
  document.getElementById("makeBlogBtn").addEventListener("click", () => {
    captionBox.classList.remove("hidden");
  });
});

console.log("Interactive Portfolio scripts loaded.");