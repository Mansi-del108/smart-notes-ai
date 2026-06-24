# Smart Notes AI 📝✨

A simple, student-friendly, and responsive single-page web application that converts study notes into structured summaries, multiple-choice questions (MCQs), or customizable flashcards using the Google Gemini API.

This project is optimized for direct browser usage or secure deployment to **Vercel** via Node.js Serverless Functions, keeping your API key hidden from frontend code.

---

## 🚀 Features

1. **Saved Notes Library**: Manage study notes with full Create, Read, and Delete capability. Notes are persistent locally in your browser using `localStorage`.
2. **Summarize Notes**: Generate a concise, study-focused summary paragraph from pasted notes.
3. **Generate MCQs**: Generate 5 multiple-choice questions with 4 distinct options and correct answers highlighted.
4. **Generate Flashcards**: Create 5 custom visual cards containing core question-and-answer concepts.

---

## 📂 File Structure

```
smart-notes-ai/
│
├── api/
│   └── summarize.js  # Vercel Node.js serverless function (safe API proxy)
│
├── index.html        # Main app UI structure (Layout split, editor panel, settings)
├── style.css         # Responsive styling (split grid layout, variables, key animations)
├── script.js         # Core logic (local storage, route selection, DOM formatting)
└── README.md         # Deployment & setup documentation
```

---

## 🛠️ Deployment Instructions

This project supports two different deployment methods:

### Option A: Secure Vercel Deployment (Recommended)
This approach completely hides your Gemini API key from the browser. The frontend calls the local `/api/summarize` proxy, which then calls Gemini on the backend using an environment variable.

1. **Deploy to Vercel**:
   - Push your code to a GitHub repository.
   - Import the project into your Vercel Dashboard.
2. **Add Environment Variable**:
   - In Vercel Project Settings, navigate to **Environment Variables**.
   - Create a variable named: **`GEMINI_API_KEY`**
   - Value: *Your actual Gemini API key* (Obtain it from [Google AI Studio](https://aistudio.google.com/)).
3. **Save and Deploy**:
   - Save the environment variable.
   - Redeploy the project. 
   - Since Vercel automatically routes the `/api/` directory, the backend function works immediately without any `vercel.json` configuration files!

---

### Option B: GitHub Pages Deployment (Static Frontend)
Since GitHub Pages hosts static files and has no serverless capabilities, you can enter your API key directly on the page.

1. **Configure Pages**:
   - Push your code to a GitHub repository.
   - Go to your repository **Settings** -> **Pages**.
   - Select the branch (e.g., `main`) and folder (`/root`), then click **Save**.
2. **Enter API Key in the UI**:
   - Open your deployed GitHub Pages URL in your browser.
   - In the sidebar under **🔑 Gemini API Key**, paste your API key.
   - The app will save the key locally to the browser's `localStorage` and perform API requests directly from the client.
   - *Note: Leave the API key field empty if you are running on Vercel to default to the secure backend proxy.*

---

## ⚡ How it Works (Under the Hood)

1. **Note Storage**: The app reads and updates the `smart_notes_list` array inside `localStorage` every time you save or delete a note.
2. **API Path Routing**:
   - If the **Gemini API Key** field in the sidebar is **filled**, the app performs a direct `fetch` call to Google Gemini (`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=...`).
   - If the field is **empty**, the app performs a `fetch` POST to `/api/summarize`, which acts as a Node.js serverless proxy, reading the key from Vercel's `process.env.GEMINI_API_KEY`.
