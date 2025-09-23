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
const uploadDropZone = document.getElementById('uploadDropZone');

let cropper = null;
let originalFileName = '';

function loadImageToPlaceholder(src) {
  const imageEl = selectedImage;
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
        const canvas = croppedCanvas;
        const croppedCanvasTemp = cropper.getCroppedCanvas({
          width: 1280,
          height: 853,
        });
        const ctx = canvas.getContext("2d");
        canvas.width = 320;
        canvas.height = 213;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(croppedCanvasTemp, 0, 0, canvas.width, canvas.height);
      }
    });
  };
}

// Drag & Drop handlers for upload zone
uploadDropZone.addEventListener('click', () => {
  imageUpload.click();
});

uploadDropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadDropZone.style.borderColor = '#333';
  uploadDropZone.style.backgroundColor = '#f0f0f0';
});

uploadDropZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  uploadDropZone.style.borderColor = '#aaa';
  uploadDropZone.style.backgroundColor = 'transparent';
});

uploadDropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadDropZone.style.borderColor = '#aaa';
  uploadDropZone.style.backgroundColor = 'transparent';

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        loadImageToPlaceholder(event.target.result);
      };
      reader.readAsDataURL(file);

      // Sync file input with dropped file
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      imageUpload.files = dataTransfer.files;
    } else {
      alert('Please drop an image file.');
    }
  }
});

// Single 'change' listener for the file input
imageUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    originalFileName = file.name;
    const reader = new FileReader();
    reader.onload = (event) => {
      loadImageToPlaceholder(event.target.result);
    };
    reader.readAsDataURL(file);
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

  const { data: insertedData, error: insertError } = await supabaseClient
  .from('blog_posts')
  .insert([{ image_url: imageUrl, caption }])
  .select('id')   // 👈 Return the ID of the inserted row
  .single();      // 👈 Expect a single row, not an array

if (insertError) {
  console.error('❌ DB Error:', insertError.message);
  alert('Database insert failed.');
  return;
}

const blogId = insertedData.id;
console.log('✅ Blog saved. ID:', blogId);

// Hide caption UI
captionInput.value = '';
captionContainer.classList.add('hidden');

// 🔄 Remove any previous "View Blog" button
const existingBtn = document.getElementById('viewBlogBtn');
if (existingBtn) {
  existingBtn.remove();
}

// ✅ Create new button
const newBtn = document.createElement('button');
newBtn.id = 'viewBlogBtn'; // ← add an ID so we can find/remove later
newBtn.innerText = '👀 View Your Live Blog';
newBtn.className = 'w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm mt-2';
newBtn.addEventListener('click', () => {
  window.open(`blog.html?featured_id=${blogId}`, '_blank');
});

// Add after Make Blog Post button
makeBlogBtn.insertAdjacentElement('afterend', newBtn);

// Show preview (optional — this is your existing preview code)
blogPreview.classList.add('dark');
blogPreview.innerHTML = `...`; // your existing preview HTML stays the same

// alert('✅ Blog post saved!');


  blogPreview.classList.add('dark');

  // Display result
  blogPreview.innerHTML = `
  <div style="background-color: rgb(127, 127, 127);" class="w-full h-full p-6 rounded shadow-inner overflow-auto">
    <div class="bg-white dark:bg-gray-800 dark:text-gray-200 text-gray-900 w-full max-w-2xl mx-auto rounded-lg shadow p-6">
      <!-- Mini Blog Header -->
      <header class="border-b pb-3 mb-3 border-gray-300 dark:border-gray-600">
        <h1 class="text-2xl font-bold text-indigo-700 dark:text-indigo-300">Your Blog</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">is live on the web.</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">scroll down for the link.</p>
      </header>

      <!-- Blog Article -->
      <article class="text-left">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-1">${caption}</h2>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
          <i class="fas fa-calendar-alt mr-1"></i>${new Date().toLocaleDateString()} &nbsp;•&nbsp;
          <i class="fas fa-user mr-1"></i> <your Domain>
        </p>
        <img src="${imageUrl}" alt="Blog Image" class="w-full rounded mb-3 max-h-60 object-cover border dark:border-gray-600" />
        
        <p class="text-sm text-gray-700 dark:text-gray-300 leading-snug mb-2">
          I found this is a fully featured image resizer designed to resize images for web blogs. The preview (1280x853) can be right-clicked and saved.
        </p>
        <p class="text-sm text-gray-700 dark:text-gray-300 leading-snug mb-2">
          Here's the link 
          <a href="https://automate-aig.pages.dev/blog.html?featured_id=${blogId}" target="_blank" class="text-blue-600 underline hover:text-blue-800">
            https://automate-aig.pages.dev/blog.html
          </a>
        </p>
       // <p class="text-sm text-gray-700 dark:text-gray-300 leading-snug">
          //Who would have thought to find something like this on a portfolio page?
       // </p>
      </article>
    </div>
  </div>
`;


  captionInput.value = '';
  captionContainer.classList.add('hidden');
  // alert('✅ Blog post saved!');
});

function containsNaughtyWords(text) {
  const blacklist = ['badword1', 'badword2', 'http', 'https', 'www', '<script', 'onerror'];
  const lower = text.toLowerCase();
  return blacklist.some(word => lower.includes(word));
}

document.addEventListener("DOMContentLoaded", () => {
  // Handle sample image clicks
  document.querySelectorAll(".sample-img").forEach(img => {
    img.addEventListener("click", () => {
      loadImageToPlaceholder(img.src);
    });
  });

  // Show caption input on button click
  makeBlogBtn.addEventListener("click", () => {
    captionContainer.classList.remove("hidden");
  });
});

console.log("Interactive Portfolio scripts loaded.");

window.resetAll = function() {
  const iframe = document.querySelector('iframe[src*="minimal2.html"]');

  if (iframe) {
    const baseSrc = iframe.src.split('?')[0];
    iframe.src = baseSrc + '?t=' + new Date().getTime();
  }

  setTimeout(() => {
    window.location.href = window.location.pathname + '?t=' + new Date().getTime();
  }, 200);
};

window.addEventListener('message', (event) => {
  if (event.data?.type === 'setHeight') {
    const iframe = document.querySelector('iframe[src="minimal2.html"]');
    if (iframe && event.data.height) {
      iframe.style.height = event.data.height + 'px';
    }
  }
});