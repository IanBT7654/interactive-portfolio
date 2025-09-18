// === CONFIG ===
const USE_DUMMY_DATA = false; // 🔁 Toggle this to true for dummy content

// === DOM REFERENCES ===
// --- AI Generator Section
const docForm = document.getElementById('docForm');
const docPrompt = document.getElementById('docPrompt');
const recipientEmail = document.getElementById('recipientEmail');
const docOutput = document.getElementById('docOutput');
const previewSection = document.getElementById('previewSection');
const downloadBtn = document.getElementById('downloadBtn');
const sendEmailBtn = document.getElementById('sendEmailBtn');

// --- Minimal Generator Section
const miniForm = document.getElementById('miniForm');
const miniPrompt = document.getElementById('miniPrompt');
const miniEmail = document.getElementById('miniEmail');
const miniOutput = document.getElementById('miniOutput');
const miniPreview = document.getElementById('miniPreview');
const miniDownloadBtn = document.getElementById('miniDownloadBtn');


// === SUBMIT HANDLERS ===

// -- AI Form
docForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const promptText = docPrompt.value.trim();
  const email = recipientEmail.value.trim();
  if (!promptText || !email) return alert('Please enter both prompt and email.');

  const content = await generateDocumentContent(promptText);
  if (!content) return alert('Failed to generate content.');

  docOutput.innerHTML = renderBrandedPDFDocument(content);
  previewSection.classList.remove('hidden');
});

// -- Mini Form
miniForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const promptText = miniPrompt.value.trim();
  const email = miniEmail.value.trim();
  if (!promptText || !email) return alert('Please enter both prompt and email.');

  const content = await generateDocumentContent(promptText);
  if (!content) return alert('Failed to generate content.');

  miniOutput.innerHTML = renderBrandedPDFDocument(content);
  miniPreview.classList.remove('hidden');
});


// === DOWNLOAD HANDLERS ===
downloadBtn?.addEventListener('click', async () => {
  await generatePdfFromElement(docOutput, 'branded-document');
});

miniDownloadBtn?.addEventListener('click', async () => {
  await generatePdfFromElement(miniOutput, 'minimal-pdf');
});


// === EMAIL (Stubbed) ===
sendEmailBtn?.addEventListener('click', async () => {
  alert('📤 Email send function not connected yet.');
});


// === CONTENT GENERATOR ===
async function generateDocumentContent(promptText) {
  if (USE_DUMMY_DATA) {
    console.log("🧪 Using dummy content");
    return `Dummy generated document content.\nPrompt was: "${promptText}"`;
  }

  console.log("🤖 Calling AI via Supabase...");
  try {
    const { supabaseClient } = await import('./config.js');
    const { data, error } = await supabaseClient.functions.invoke('generate_doc', {
      body: { prompt: promptText }
    });

    if (error) {
      console.error('❌ AI generation error:', error);
      return null;
    }

    console.log('✅ AI response received');
    return data.result;
  } catch (err) {
    console.error('❌ Error calling AI function:', err);
    return null;
  }
}


// === PDF GENERATOR ===
async function generatePdfFromElement(element, filenamePrefix = 'document') {
  if (!element || !element.innerHTML.trim()) {
    console.error("❌ PDF content area is empty.");
    return alert("Document content is empty.");
  }

  const opt = {
    margin: 0.5,
    filename: `${filenamePrefix}-${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  await new Promise(resolve => setTimeout(resolve, 300)); // Give time for styles to apply
  await html2pdf().set(opt).from(element).save();
}


// === RENDER FUNCTION ===
function renderBrandedPDFDocument(aiText = '') {
  const title = 'Automate-AIG Generated Document';

  const htmlFormattedContent = aiText
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>');

  return `
    <div style="font-family: 'Roboto Mono', monospace; font-size: 14px; background: white; border: 1px solid #ccc; border-radius: 8px; max-width: 750px; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(to right, #2563eb, #4f46e5); color: white; padding: 24px 32px;">
        <h1 style="margin: 0; font-size: 24px;">${title}</h1>
        <p style="margin-top: 4px;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      <div style="padding: 32px;"><p>${htmlFormattedContent}</p></div>
      <div style="background-color: #f5f8ff; color: #555; font-size: 12px; padding: 16px 32px; text-align: center; border-top: 1px solid #ccc;">
        &copy; 2025 Ian B | Built with GitHub, Supabase, Resend, and html2pdf.js
      </div>
    </div>`;
}
