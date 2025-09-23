import { supabaseClient } from './config.js';

const USE_DUMMY_DATA = true;

const form = document.getElementById('docForm');
const docPrompt = document.getElementById('docPrompt');
const recipientEmail = document.getElementById('recipientEmail');
const docOutput = document.getElementById('docOutput');
const previewSection = document.getElementById('previewSection');
const downloadBtn = document.getElementById('downloadBtn');
const sendEmailBtn = document.getElementById('sendEmailBtn');
const sendToEmail = recipientEmail;
const emailPair = document.getElementById('emailPair');
const statusSection = document.getElementById('statusSection');

// Initial State
sendEmailBtn.disabled = true;
sendToEmail.disabled = true;
emailPair.style.opacity = 0.5;
emailPair.style.pointerEvents = 'none';
statusSection.classList.add('hidden');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const promptText = docPrompt.value.trim();
  if (!promptText) return alert("Please enter a prompt.");

  // Reset animation
  previewSection.classList.remove('show');

  let generatedText;
  if (USE_DUMMY_DATA) {
    generatedText = `Dummy document content.\nPrompt: ${promptText}`;
  } else {
    generatedText = await generateDocumentWithAI(promptText);
    if (!generatedText) return alert("AI failed to generate document.");
  }

  const brandedHtml = renderBrandedPDFDocument(generatedText);
  docOutput.innerHTML = brandedHtml;
  
// Reveal the preview section with expand effect
//previewSection.classList.remove('hidden');
previewSection.classList.add('show');

// Scroll to download button after a slight delay for animation
setTimeout(() => {
  downloadBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
}, 300);
});

async function generateDocumentWithAI(prompt) {
  try {
    const { data, error } = await supabaseClient.functions.invoke('generate_doc', {
      body: { prompt }
    });
    if (error) throw new Error(error.message);
    return data.result;
  } catch (err) {
    console.error(err);
    return null;
  }
}

downloadBtn.addEventListener('click', async () => {
  await generatePdfClientSide();

  downloadBtn.disabled = true;
  downloadBtn.style.opacity = 0.5;

  sendEmailBtn.disabled = false;
  sendToEmail.disabled = false;
  emailPair.style.opacity = 1;
  emailPair.style.pointerEvents = 'auto';
  sendToEmail.focus();
});

sendEmailBtn.addEventListener('click', async () => {
  const email = sendToEmail.value.trim();
  if (!validateEmail(email)) return alert("Enter a valid email address.");

  const fileUrl = await generatePdfAndUpload();
  if (!fileUrl) return alert("PDF upload failed. Email not sent.");

  const { data, error } = await supabaseClient.functions.invoke('send-email', {
    body: { email, file_url: fileUrl }
  });

  if (error) {
    console.error('Email send failed:', error);
    return alert("Failed to send email.");
  }

  console.log("Email sent. Message ID:", data?.message_id);
  sendEmailBtn.disabled = true;
  sendToEmail.disabled = true;
  emailPair.style.opacity = 0.5;
  emailPair.style.pointerEvents = 'none';
  statusSection.classList.remove('hidden');

  window.parent.postMessage({ action: 'focusReset' }, '*');
});

async function generatePdfClientSide() {
  const element = document.getElementById('docOutput');
  const opt = {
    margin: 0.5,
    filename: `branded-document-${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, scrollY: 0, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  await new Promise(r => setTimeout(r, 300));
  await html2pdf().set(opt).from(element).save();
}

async function generatePdfAndUpload() {
  const element = document.getElementById('docOutput');
  const opt = {
    margin: 0.5,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, scrollY: 0, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  try {
    const blob = await html2pdf().set(opt).from(element).output('blob');
    const filename = `document-${Date.now()}.pdf`;

    const { data, error } = await supabaseClient.storage
      .from('aig-docos')
      .upload(filename, blob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) throw error;

    const { data: publicUrlData } = supabaseClient.storage
      .from('aig-docos')
      .getPublicUrl(filename);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.error('Upload failed:', err);
    return null;
  }
}

function renderBrandedPDFDocument(aiText = '') {
  const formatted = aiText
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/\n{2,}/g, '\n\n')
    .split(/\n{2,}/g)
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #000;">
      <div style="background: #2563eb; color: white; padding: 20px;">
        <h1>Automate-AIG Generated Document</h1>
        <p>${new Date().toLocaleDateString()}</p>
      </div>
      <div style="padding: 20px 0;">${formatted}</div>
      <div style="background: #f5f8ff; text-align: center; font-size: 12px; padding: 12px; border-top: 1px solid #ccc;">
        &copy; 2025 Ian B | Built with Supabase, Resend, and html2pdf.js
      </div>
    </div>
  `;
}

function sendHeight() {
  const height = document.documentElement.scrollHeight;
  window.parent.postMessage({ type: 'setHeight', height }, '*');
}

window.addEventListener('load', sendHeight);
window.addEventListener('resize', sendHeight);

// If content changes dynamically, you may want to call sendHeight() again after updates.


function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
