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

// 🔞 Profanity + unsafe content check using bad-words
async function containsNaughtyWords(text) {
  // Dynamically import bad-words properly
  const module = await import('https://cdn.skypack.dev/bad-words');
  const Filter = module.default || module; // Handle both ESM and default export
  const filter = new Filter();

  // Optional: Add your own extra banned words
  filter.addWords('yourcustombadword', 'anotherbadword');

  // Manual blacklist for unsafe HTML/JS content
  const manualBlacklist = ['http', 'https', 'www', '<script', 'onerror', 'base64'];
  const lower = text.toLowerCase();

  const hasManual = manualBlacklist.some(word => lower.includes(word));
  const hasProfanity = filter.isProfane(lower);

  return hasManual || hasProfanity;
}


const imageUpload = document.getElementById('imageUpload');
const selectedImage = document.getElementById('selectedImage');
const croppedCanvas = document.getElementById('croppedPreview');
const captionInput = document.getElementById('caption');
const captionContainer = document.getElementById('captionInputContainer');
const makeBlogBtn = document.getElementById('makeBlogBtn');
const submitBlogBtn = document.getElementById('submitBlogBtn');
const blogPreview = document.getElementById('blogPostPreview');
const uploadDropZone = document.getElementById('uploadDropZone');

  const parentSpinner = document.getElementById('parentSpinner');
  const envelope = document.getElementById('envelope');
  const emailDeliveredBtn = document.getElementById('emailDeliveredBtn');
  const activityInfoText = document.getElementById('activityInfoText');
  const resetBtn = document.getElementById('resetBtn');

if (!imageUpload) console.error('❌ imageUpload not found');
if (!uploadDropZone) console.error('❌ uploadDropZone not found');

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

// 🖼️ Click handler for sample images
document.querySelectorAll('.sample-img').forEach(img => {
  img.addEventListener('click', () => {
    loadImageToPlaceholder(img.src);
  });
});

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

  if (!caption) {
    alert('Caption is required.');
    return;
  }

  // 🔞 Check for profanity or unsafe content
  if (await containsNaughtyWords(caption)) {
    alert('⚠️ Caption contains restricted or unsafe content.');
    return;
  }

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
    .select('id')
    .single();

  if (insertError) {
    console.error('❌ DB Error:', insertError.message);
    alert('Database insert failed.');
    return;
  }

  const blogId = insertedData.id;
  console.log('✅ Blog saved. ID:', blogId);

  captionInput.value = '';
  captionContainer.classList.add('hidden');

  // Remove existing button if needed
  const existingBtn = document.getElementById('viewBlogBtn');
  if (existingBtn) existingBtn.remove();

  const newBtn = document.createElement('button');
  newBtn.id = 'viewBlogBtn';
  newBtn.innerText = '👀 View Your Live Blog';
  newBtn.className = 'w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm mt-2';
  newBtn.addEventListener('click', () => {
    window.open(`blog.html?featured_id=${blogId}`, '_blank');
  });

  makeBlogBtn.insertAdjacentElement('afterend', newBtn);

  // Set blog preview HTML
  blogPreview.classList.add('dark');
  blogPreview.innerHTML = `
  <div style="background-color: rgb(127, 127, 127);" class="w-full h-full p-6 rounded shadow-inner overflow-auto">
    <div class="bg-white dark:bg-gray-800 dark:text-gray-200 text-gray-900 w-full max-w-2xl mx-auto rounded-lg shadow p-6">
      <header class="border-b pb-3 mb-3 border-gray-300 dark:border-gray-600">
        <h1 class="text-2xl font-bold text-indigo-700 dark:text-indigo-300">Your Blog</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">is live on the web.</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">scroll down for the link.</p>
      </header>

      <article class="text-left">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-1">${caption}</h2>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
          ${new Date().toLocaleDateString()} &nbsp;•&nbsp; <your domain>
        </p>
        <img src="${imageUrl}" alt="Blog Image" class="w-full rounded mb-3 max-h-60 object-cover border dark:border-gray-600" />

        <p class="text-sm text-gray-700 dark:text-gray-300 leading-snug mb-2">
          This image was resized and uploaded via the interactive profile page demo.
        </p>
        <p class="text-sm text-gray-700 dark:text-gray-300 leading-snug mb-2">
          Here's the live link:
          <a href="https://automate-aig.pages.dev/blog.html?featured_id=${blogId}" target="_blank" class="text-blue-600 underline hover:text-blue-800">
            https://automate-aig.pages.dev/blog.html?featured_id=${blogId}
          </a>
        </p>
      </article>
    </div>
  </div>`;
});

/* function containsNaughtyWords(text) {
  const blacklist = ['badword1', 'badword2', 'http', 'https', 'www', '<script', 'onerror'];
  const lower = text.toLowerCase();
  return blacklist.some(word => lower.includes(word));
} */


// 🧠 Spinner + Reset Handlers
function showParentSpinner() {
  const parentSpinner = document.getElementById('parentSpinner');
  const envelope = document.getElementById('envelope');
  const emailDeliveredBtn = document.getElementById('emailDeliveredBtn');
  const activityInfoText = document.getElementById('activityInfoText');

  if (emailDeliveredBtn) emailDeliveredBtn.style.display = 'none';
  if (activityInfoText) activityInfoText.style.opacity = 0;
  if (parentSpinner) parentSpinner.style.display = 'block';

  if (envelope) {
    envelope.style.animation = 'none'; // reset animation
    envelope.offsetHeight;             // trigger reflow
    envelope.style.animation = 'slideAcross 3s linear forwards';
  }
}

function hideParentSpinner() {
  const parentSpinner = document.getElementById('parentSpinner');
  const emailDeliveredBtn = document.getElementById('emailDeliveredBtn');
  const activityInfoText = document.getElementById('activityInfoText');

  if (parentSpinner) parentSpinner.style.display = 'none';
  if (emailDeliveredBtn) emailDeliveredBtn.style.display = 'inline-block';
  if (activityInfoText) activityInfoText.style.opacity = 1;
}

function handleReset() {
  const emailDeliveredBtn = document.getElementById('emailDeliveredBtn');
  const activityInfoText = document.getElementById('activityInfoText');

  if (emailDeliveredBtn) emailDeliveredBtn.style.display = 'none';
  if (activityInfoText) activityInfoText.style.opacity = 0;

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Trigger global reset if available
  if (typeof window.resetAll === 'function') {
    window.resetAll();
  }

  // Optionally reload iframe (if needed)
  const iframe = document.querySelector('iframe');
  if (iframe) iframe.src = iframe.src;
}

document.addEventListener('DOMContentLoaded', () => {
  const envelope = document.getElementById('envelope');
  const resetBtn = document.getElementById('resetBtn');

  // Attach animation end listener to hide spinner after envelope animation
  if (envelope) {
    envelope.addEventListener('animationend', hideParentSpinner);
  }

  // Attach reset button logic
  if (resetBtn) {
    resetBtn.addEventListener('click', handleReset);
  }
});

// 🔁 Unified postMessage listener
window.addEventListener('message', (event) => {
  if (!event.data || !event.data.action) return;

  switch (event.data.action) {
    case 'showSpinner':
      showParentSpinner();
      break;
    case 'hideSpinner':
      hideParentSpinner();
      break;
    case 'resetAll':
      handleReset();
      break;
    case 'focusReset':
      const resetBtn = document.getElementById('resetBtn');
      if (resetBtn) resetBtn.focus();
    break;
    default:
      console.warn('Unknown action:', event.data.action);
  }
});
