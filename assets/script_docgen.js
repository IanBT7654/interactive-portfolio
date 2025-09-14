// assets/script_docgen.js

import { supabaseClient  } from './config.js';

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

// Handle Form Submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const promptText = docPrompt.value.trim();
  const email = recipientEmail.value.trim();

  if (!promptText || !email) return alert('Please enter both prompt and email.');

  // ✨ Call AI
  console.log('001');

  const generatedText = await generateDocumentWithAI(promptText);
  console.log('AI generation:', promptText);
  console.log('AI generation:', generatedText);

  if (!generatedText) return alert('AI failed to generate document.');

  // 📝 Show in preview
  docOutput.innerText = generatedText;
  previewSection.classList.remove('hidden');
});

// 🧠 Simulated AI Generator (Replace with real fetch to OpenAI/Groq)

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

// 📩 Handle Email Send
sendEmailBtn.addEventListener('click', async () => {
  const email = recipientEmail.value.trim();
  const docContent = docOutput.innerText;

  if (!docContent || !email) return alert('Missing content or email.');

  // Convert to PDF
  const pdfBlob = await html2pdf().from(docOutput).outputPdf('blob');

  // Upload PDF to Supabase
  const filename = `doc-${Date.now()}.pdf`;
  const { data: uploadData, error: uploadError } = await supabaseClient.storage
    .from('documents')
    .upload(filename, pdfBlob, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'application/pdf'
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return alert('Failed to upload PDF.');
  }

  const { publicURL } = supabaseClient.storage.from('documents').getPublicUrl(filename);
  if (!publicURL) return alert('Could not get public URL.');

  // Call Supabase Edge Function to trigger Resend email
  const res = await fetch('/functions/v1/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, file_url: publicURL })
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

  // Start tracking status
  trackEmailStatus(message_id);
});

// ⏱️ Polling Tracker
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

// ⬇️ Download PDF
downloadBtn.addEventListener('click', () => {
  html2pdf().from(docOutput).save(`Document_${Date.now()}.pdf`);
});
