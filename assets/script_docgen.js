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
    // Bypass AI call, inject dummy text
    generatedText = `Dummy generated document content.\nSecond line of dummy content.\nPrompt was: "${promptText}"`;
  } else {
    generatedText = await generateDocumentWithAI(promptText);
    if (!generatedText) {
      return alert('AI failed to generate document.');
    }
  }

  // 📝 Insert generated content (preserves line breaks)
  //docOutput.textContent = generatedText;
  docOutput.innerHTML = generatedText.replace(/\n/g, '<br>');


  // Show preview section
  previewSection.classList.remove('hidden');
});

// 🧠 Call Supabase edge function (AI → text)


async function generateDocumentWithAI(prompt) {
  if (USE_DUMMY_DATA) {
    console.log('⚠️ Using dummy data');
    return `📝 Dummy Generated Document

This is a simulated AI document for debugging purposes.

Line breaks are respected.
- Item one
- Item two
- Item three

Regards,
Debug Bot`;
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

// 📩 Send Email + PDF Upload
sendEmailBtn.addEventListener('click', async () => {
  const email = recipientEmail.value.trim();
  const docContent = docOutput.innerHTML.trim();
  const bounds = docOutput.getBoundingClientRect();

  if (!docContent || bounds.height === 0 || bounds.width === 0) {
    return alert('Document is empty or not visible.');
  }

  // Ensure docOutput is visible
  docOutput.style.display = 'block';

  // Wait for DOM to render completely before generating PDF
  console.log("⏳ Waiting for DOM to stabilize before generating PDF...");
  await waitForStableDOM(4000); // 4s delay + next paint

  if (bounds.height === 0) {
    console.warn('⚠️ docOutput has no height — PDF may be blank.');
  }

  const pdfBlob = await html2pdf()
    .set({
      margin: 10,
      filename: 'document.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { useCORS: true, scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    })
    .from(docOutput)
    .outputPdf('blob');

  console.log('📄 PDF Source:', docOutput.textContent);

  if (!pdfBlob || pdfBlob.size === 0) {
    console.error('⚠️ Empty PDF blob generated.');
    return alert('PDF generation failed — content may be hidden or invalid.');
  }

  // Upload to Supabase
  const filename = `doc-${Date.now()}.pdf`;
  const { data: uploadData, error: uploadError } = await supabaseClient.storage
    .from('aig-docos')
    .upload(filename, pdfBlob, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'application/pdf'
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return alert('Failed to upload PDF.');
  }

  // ✅ Get public URL
  const { publicUrl, error: urlError } = supabaseClient
    .storage
    .from('aig-docos')
    .getPublicUrl(filename);

  if (urlError || !publicUrl) {
    console.error('❌ Failed to get public URL:', urlError);
    return alert('Could not get public URL.');
  }

  // Send email via edge function
  const res = await fetch('/functions/v1/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, file_url: publicUrl })
  });

  let result;
  try {
    result = await res.json();
  } catch (err) {
    console.error('Failed to parse JSON:', err);
    return alert('Unexpected server response.');
  }

  if (!res.ok) {
    console.error('Send email failed:', result);
    return alert('Email sending failed.');
  }

  const { message_id } = result;

  // Show status
  statusSection.classList.remove('hidden');
  statusSent.textContent = `📤 Sent: ${new Date().toLocaleTimeString()}`;
  statusDelivered.textContent = `📬 Delivered: (waiting...)`;
  statusOpened.textContent = `📖 Opened: (waiting...)`;

  trackEmailStatus(message_id);
});


// 🔄 Email status polling
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

// ⬇️ Local PDF download
downloadBtn.addEventListener('click', () => {

 console.log("📄 HTML content:", docOutput.innerHTML);
 console.log("📏 docOutput size:", docOutput.getBoundingClientRect());

  //html2pdf().from(docOutput).save(`Document_${Date.now()}.pdf`);

  (async () => {
  console.log("⏳ Waiting before generating local PDF...");
  await waitForStableDOM(4000);

  html2pdf().from(docOutput).save(`Document_${Date.now()}.pdf`);
})();

});
