import { supabaseClient } from './config.js';

// Debug toggle: true = use dummy data, false = call real AI function
const USE_DUMMY_DATA = true;

// DOM elements
const form = document.getElementById('docForm');
const docPrompt = document.getElementById('docPrompt');
const recipientEmail = document.getElementById('recipientEmail');
const docOutput = document.getElementById('docOutput');
const previewSection = document.getElementById('previewSection');
const sendEmailBtn = document.getElementById('sendEmailBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusSection = document.getElementById('statusSection');

// Status fields
const statusSent = document.getElementById('status-sent');
const statusDelivered = document.getElementById('status-delivered');
const statusOpened = document.getElementById('status-opened');

// Global cache to avoid duplicate PDF generation
let generatedPdfUrl = null;

// Waits for next paint + an optional delay (default: 4000ms)
async function waitForStableDOM(delay = 4000) {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      setTimeout(resolve, delay);
    });
  });
}

// ✨ Handle Form Submit
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

  // Insert generated content (preserves line breaks)
  docOutput.innerHTML = generatedText.replace(/\n/g, '<br>');

  // Show preview
  previewSection.classList.remove('hidden');
});

// 🧠 Generate text from AI (Supabase Edge Function)
async function generateDocumentWithAI(prompt) {
  if (USE_DUMMY_DATA) {
    console.log('⚠️ Using dummy data');
    return `📝 Dummy Generated Document\n\nThis is a simulated AI document for debugging purposes.\n\nLine breaks are respected.\n- Item one\n- Item two\n- Item three\n\nRegards,\nDebug Bot`;
  }

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

// 🧾 Shared function: Generate PDF from HTML if not already generated
async function generatePdfIfNeeded() {
  if (generatedPdfUrl) {
    console.log("♻️ Reusing cached PDF:", generatedPdfUrl);
    return generatedPdfUrl;
  }

  const htmlContent = docOutput.outerHTML.trim();
  const bounds = docOutput.getBoundingClientRect();

  if (!htmlContent || bounds.height === 0 || bounds.width === 0) {
    throw new Error('❌ Document is empty or not visible.');
  }

  console.log("⏳ Sending HTML to Supabase Edge Function to generate PDF...");

  const { data, error } = await supabaseClient.functions.invoke('generate_pdf', {
    body: {
      html: htmlContent,
      filename: `document-${Date.now()}`
    }
  });

  if (error || !data?.url) {
    console.error('❌ PDF generation failed:', error || data);
    throw new Error('PDF generation failed on the server.');
  }

  generatedPdfUrl = data.url;
  console.log("✅ PDF generated and cached:", generatedPdfUrl);
  return generatedPdfUrl;
}

// 📩 Send email with PDF attached
sendEmailBtn.addEventListener('click', async () => {
  const email = recipientEmail.value.trim();
  if (!email) return alert('Please enter an email.');

  try {
    const publicUrl = await generatePdfIfNeeded();

    const res = await fetch('/functions/v1/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, file_url: publicUrl })
    });

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

// ⬇️ Download PDF locally
downloadBtn.addEventListener('click', async () => {
  try {
    const pdfUrl = await generatePdfIfNeeded();

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Document_${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Download error:', err);
    alert(err.message || 'Failed to download PDF.');
  }
});

// 🔄 Poll for email delivery/open status
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
      clearInterval(interval); // stop polling
    }
  }, 4000);
}
