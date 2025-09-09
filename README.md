# Interactive Portfolio





\## 🚀 automate-aig



Tagline:

Your interactive automation and AI generative toolbox



🧠 About the Name



The name automate-aig combines two key ideas:



Automate — representing task automation, scripting, and productivity workflows



AIG — shorthand for AI Generative, highlighting the modern generative AI techniques used throughout the project (image generation, text creation, intelligent helpers, etc.)



"Generative" is one of the most important capabilities of today's AI — making this acronym future-proof and relevant.



\*Interactive portfolio powered by automation + AIG\*

\*\*Live site:\*\* \[https://automate-aig.pages.dev/](https://automate-aig.pages.dev/)



\### 🧩 Features



\* ✅ Image Resizer with aspect-ratio crop (1280x853)

\* ✅ Upload cropped image to Supabase storage (`blog-images`)

\* ✅ Caption filter with blog preview rendering

\* ✅ Blog posts saved to Supabase `blog\_posts` table

\* ⚙️ Fully client-side with Cloudflare Pages + Supabase backend

\* 📦 Planned: AI Error Explainer, Doc Generator, Time Tracker



---



\### 🛠️ Tech Stack



\* \*\*HTML/CSS/JS\*\*: Lightweight front-end

\* \*\*Tailwind CSS\*\*: Utility-based responsive styling

\* \*\*Cropper.js\*\*: Easy user cropping with locked aspect ratio

\* \*\*Supabase\*\*:



&nbsp; \* Public bucket for images

&nbsp; \* Postgres DB for blog metadata

&nbsp; \* Row-level security configured via dashboard

\* \*\*Cloudflare Pages\*\*: Continuous deployment from GitHub



---



\### 📁 Project Structure



```

📂 root/

├─ index.html          # Main UI

├─ assets/

│  ├─ styles.css       # Custom styles

│  ├─ config.js        # Supabase URL + anon key

│  └─ scripts.js       # Core interaction logic

└─ images/             # (Optional) Sample images for local testing

```



---



\### 🔧 Local Setup



1\. \*\*Clone this repo\*\*



&nbsp;  ```bash

&nbsp;  git clone https://github.com/yourusername/automate-aig.git

&nbsp;  cd automate-aig

&nbsp;  ```



2\. \*\*Edit `assets/config.js` with your Supabase credentials:\*\*



&nbsp;  ```js

&nbsp;  const SUPABASE\_URL = 'https://your-instance.supabase.co';

&nbsp;  const SUPABASE\_ANON\_KEY = 'your-anon-key';

&nbsp;  ```



3\. \*\*Open `index.html` in your browser.\*\* No build step needed.



---



\### ☁️ Deployment (Cloudflare Pages)



1\. Connect repo to Cloudflare Pages

2\. Set "Framework preset" to \*\*None\*\*

3\. Leave build command blank, and set output directory to `/`

4\. Done! Changes to `main` auto-deploy



---



\### 📖 Blog Table Schema



Supabase table: `blog\_posts`



```sql

CREATE TABLE blog\_posts (

&nbsp; id BIGSERIAL PRIMARY KEY,

&nbsp; image\_url TEXT NOT NULL,

&nbsp; caption TEXT NOT NULL,

&nbsp; created\_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

```



Supabase bucket: `blog-images` (public)



---



\### ✅ Status



| Module              | Status     |

| ------------------- | ---------- |

| Image Crop + Upload | ✅ Done     |

| Blog Save + Preview | ✅ Done     |

| Caption Filtering   | ✅ Done     |

| Responsive Layout   | 🔧 Planned |

| Blog Feed Display   | 🔧 Planned |

| AI Tool Integration | 🔧 Planned |



---



\### 📌 Notes



\* No login required — fully public-facing

\* Edge-friendly: no server code required

\* Caption input is filtered to prevent XSS or link spam

\* Cropper enforces fixed 1280x853 ratio to standardize blog visuals



---



Let me know if you’d like me to help generate a `LICENSE`, `.gitignore`, or add a deploy badge for Cloudflare Pages.



