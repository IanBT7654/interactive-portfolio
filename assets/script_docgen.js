// --- ORIGINAL script_docgen.js CONTENT ---
import { supabaseClient } from './config.js';

const USE_DUMMY_DATA = true;

const form = document.getElementById('docForm');
const docPrompt = document.getElementById('docPrompt');
const recipientEmail = document.getElementById('recipientEmail');
const docOutput = document.getElementById('docOutput');
const previewSection = document.getElementById('previewSection');
const sendEmailBtn = document.getElementById('sendEmailBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusSection = document.getElementById('statusSection');

const statusSent = document.getElementById('status-sent');
const statusDelivered = document.getElementById('status-delivered');
const statusOpened = document.getElementById('status-opened');

let generatedPdfUrl = null;

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const promptText = docPrompt.value.trim();
  const email = recipientEmail.value.trim();

  if (!promptText || !email) {
    return alert('Please enter both prompt and email.');
  }

  let generatedText;

  if (USE_DUMMY_DATA) {
    generatedText = `Dummy generated document content.\nSecond line of dummy content.\nPrompt was: "${promptText}"`;
  } else {
    generatedText = await generateDocumentWithAI(promptText);
    if (!generatedText) {
      return alert('AI failed to generate document.');
    }
  }

  docOutput.innerHTML = renderBrandedPDFDocument(generatedText);
  previewSection.classList.remove('hidden');
});

async function generateDocumentWithAI(prompt) {
  try {
    const { data, error } = await supabaseClient.functions.invoke('generate_doc', {
      body: { prompt }
    });

    if (error) {
      console.error('Function Error:', error);
      throw new Error(error.message || 'AI generation failed');
    }

    return data.result;
  } catch (err) {
    console.error('AI generation error:', err);
    return null;
  }
}

sendEmailBtn.addEventListener('click', async () => {
  const email = recipientEmail.value.trim();
  if (!email) return alert('Please enter an email.');

  try {
    const publicUrl = await generatePdfIfNeeded();

    const { data, error } = await supabaseClient.functions.invoke('send-email', {
      body: { email, file_url: publicUrl }
    });

    if (error) {
      console.error('Send email failed:', error);
      return alert('Email sending failed.');
    }

    const result = await res.json();

    if (!res.ok) {
      console.error('Send email failed:', result);
      return alert('Email sending failed.');
    }

    const { message_id } = result;

    statusSection.classList.remove('hidden');
    statusSent.textContent = `📤 Sent: ${new Date().toLocaleTimeString()}`;
    statusDelivered.textContent = `📬 Delivered: (waiting...)`;
    statusOpened.textContent = `📖 Opened: (waiting...)`;

    trackEmailStatus(message_id);
  } catch (err) {
    alert(err.message || 'Something went wrong during email send.');
  }
});

downloadBtn.addEventListener('click', async () => {
  try {
    console.log("🧾 Download button clicked");
    await generatePdfClientSide();
  } catch (err) {
    console.error('Download error:', err);
    alert(err.message || 'Failed to download PDF.');
  }
});

function trackEmailStatus(message_id) {
  const interval = setInterval(async () => {
    const { data, error } = await supabaseClient
      .from('email_tracking')
      .select('*')
      .eq('message_id', message_id)
      .single();

    if (error || !data) return;

    if (data.delivered_at) {
      statusDelivered.textContent = `📬 Delivered: ${new Date(data.delivered_at).toLocaleTimeString()}`;
    }

    if (data.opened_at) {
      statusOpened.textContent = `📖 Opened: ${new Date(data.opened_at).toLocaleTimeString()}`;
      clearInterval(interval);
    }
  }, 4000);
}

function renderBrandedPDFDocument(aiText = '') {
  const title = 'Automate-AIG Generated Document';
  const htmlFormattedContent = aiText
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 18px; margin-bottom: 8px;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 20px; margin-bottom: 10px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 22px; margin-bottom: 12px;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>');

  return `
    <div style="font-family: 'Roboto Mono', monospace; font-size: 14px; color: #000; background: white; border: 1px solid #ccc; border-radius: 8px; overflow: visible; box-shadow: 0 0 10px rgba(0,0,0,0.05); width: 100%; max-width: 750px; margin: auto;">
      <div style="background: linear-gradient(to right, #2563eb, #4f46e5); color: white; padding: 24px 32px;">
        <h1 style="margin: 0; font-size: 24px;">${title}</h1>
        <p style="margin-top: 4px; font-size: 14px;">Generated using AI on ${new Date().toLocaleDateString()}</p>
      </div>
      <div style="padding: 32px;">
        <p>${htmlFormattedContent}</p>
      </div>
      <div style="background-color: #f5f8ff; color: #555; font-size: 12px; padding: 16px 32px; text-align: center; border-top: 1px solid #ccc;">
        &copy; 2025 Ian B | Built with GitHub, Supabase, Resend, and html2pdf.js
      </div>
    </div>
  `;
}

// --- SEPARATE MINI TEST FUNCTIONS with _mini suffix ---

const miniForm_mini = document.getElementById('miniForm');
const miniPrompt_mini = document.getElementById('miniPrompt');
const miniEmail_mini = document.getElementById('miniEmail');
const miniOutput_mini = document.getElementById('miniOutput');
const miniPreview_mini = document.getElementById('miniPreview');
const miniDownloadBtn_mini = document.getElementById('miniDownloadBtn');

if (miniForm_mini) {
  miniForm_mini.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('⚠️ [Mini] Submit handler started');

    const promptText = miniPrompt_mini.value.trim();
    const email = miniEmail_mini.value.trim();

    if (!promptText || !email) {
      return alert('Please enter both prompt and email.');
    }

    let generatedText;

    if (USE_DUMMY_DATA) {
      console.log('⚠️ [Mini] Using dummy data');
      generatedText = `Dummy generated document content.\nSecond line of dummy content.\nPrompt was: "${promptText}"`;
    } else {
      console.log('⚠️ [Mini] Attempting to call generateDocumentWithAI_mini');
      generatedText = await generateDocumentWithAI_mini(promptText);
      if (!generatedText) {
        return alert('AI failed to generate document.');
      }
    }

    const brandedHtml = renderBrandedPDFDocument_mini(generatedText);
    miniOutput_mini.innerHTML = brandedHtml;
    miniOutput_mini.offsetHeight;
    miniPreview_mini.classList.remove('hidden');

    console.log('⚠️ [Mini] Preview section shown');
  });

  miniDownloadBtn_mini.addEventListener('click', async () => {
    console.log("🧾 [Mini] Download button clicked");
    await generatePdfClientSide_mini(miniOutput_mini);
  });
}

async function generateDocumentWithAI_mini(prompt) {
  try {
    const { data, error } = await supabaseClient.functions.invoke('generate_doc', {
      body: { prompt }
    });

    if (error) {
      console.error('[Mini] Function Error:', error);
      throw new Error(error.message || 'AI generation failed');
    }

    return data.result;
  } catch (err) {
    console.error('[Mini] AI generation error:', err);
    return null;
  }
}

function renderBrandedPDFDocument_mini(aiText = '') {
  const title = 'Automate-AIG Generated Document (Mini)';
  const htmlFormattedContent = aiText
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 18px; margin-bottom: 8px;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 20px; margin-bottom: 10px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 22px; margin-bottom: 12px;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>');

  return `
    <div style="font-family: 'Roboto Mono', monospace; font-size: 14px; color: #000; background: white; border: 1px solid #ccc; border-radius: 8px; overflow: visible; box-shadow: 0 0 10px rgba(0,0,0,0.05); width: 100%; max-width: 750px; margin: auto;">
      <div style="background: linear-gradient(to right, #2563eb, #4f46e5); color: white; padding: 24px 32px;">
        <h1 style="margin: 0; font-size: 24px;">${title}</h1>
        <p style="margin-top: 4px; font-size: 14px;">Generated using AI on ${new Date().toLocaleDateString()}</p>
      </div>
      <div style="padding: 32px;">
        <p>${htmlFormattedContent}</p>
      </div>
      <div style="background-color: #f5f8ff; color: #555; font-size: 12px; padding: 16px 32px; text-align: center; border-top: 1px solid #ccc;">
        &copy; 2025 Ian B | Built with GitHub, Supabase, Resend, and html2pdf.js
      </div>
    </div>
  `;
}

async function generatePdfClientSide_mini(element = miniOutput_mini) {
  if (!element || !element.innerHTML.trim()) {
    console.error("[Mini] docOutput is empty. Aborting PDF generation.");
    return alert("Document content is empty.");
  }

  console.log('[Mini] Starting client-side PDF generation');
  console.log('[Mini] Content size:', element.offsetWidth, 'x', element.offsetHeight);

  const opt = {
    margin: 0.5,
    filename: `branded-document-mini-${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  await new Promise(resolve => setTimeout(resolve, 300));
  console.log("[Mini] Content innerHTML snapshot:", element.innerHTML.slice(0, 300));
console.log("[Mini] Content textContent snapshot:", element.textContent.slice(0, 300));
  await html2pdf().set(opt).from(element).save();
}
