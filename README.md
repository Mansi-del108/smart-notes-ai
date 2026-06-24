# Smart Notes AI 📝✨

A simple, student-friendly, and responsive single-page web application that converts study notes into structured summaries, multiple-choice questions (MCQs), or customizable flashcards using the Google Gemini API.

Built entirely using raw **HTML**, **CSS**, and **Vanilla JavaScript** without any external frameworks, databases, or complex configurations.

---

## 🚀 Features

1. **Summarize Notes**: Generate a concise, study-focused summary paragraph from pasted notes.
2. **Generate MCQs**: Generate 5 multiple-choice questions with 4 distinct options and correct answers highlighted.
3. **Generate Flashcards**: Create 5 custom visual cards containing core question-and-answer concepts.

---

## 📂 File Structure

```
smart-notes-ai/
│
├── index.html   # Main application structure (Layout, textarea, inputs, and UI widgets)
├── style.css    # Aesthetic styles (Responsive design, soft transitions, blue palette)
├── script.js    # Application logic (Event handlers, Gemini API fetch, parsing & rendering)
└── README.md    # Getting started documentation
```

---

## 🛠️ Getting Started

To run this project locally, follow these steps:

### 1. Obtain a Google Gemini API Key
1. Visit the [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click on the **Create API Key** button.
4. Copy your generated API key.

### 2. Add Your API Key
1. Open the file [script.js](file:///C:/Users/DELL/.gemini/antigravity/scratch/smart-notes-ai/script.js).
2. Locate the variable at the top of the file:
   ```javascript
   const GEMINI_API_KEY = "YOUR_API_KEY_HERE";
   ```
3. Replace `"YOUR_API_KEY_HERE"` with your actual API key.
4. Save the file.

### 3. Open the App in Your Browser
Double-click `index.html` (or drag and drop it into any modern web browser like Chrome, Firefox, or Edge) to launch the application.

---

## ⚡ How it Works (Under the Hood)

This application uses the native browser `fetch()` API to call the **Google Gemini API** (`gemini-2.5-flash` model endpoint). 

Here is how the API communication works:

1. **Validation**: The script checks if the notes input is empty or too short (less than 20 characters).
2. **Payload Construction**: The script bundles the user's notes and prepends a prompt instructing the model to analyze the content and respond with structured JSON format using `generationConfig.responseMimeType = "application/json"`.
3. **API Request**:
   ```javascript
   const response = await fetch(
       `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
       {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(apiPayload)
       }
   );
   ```
4. **Parsing & Rendering**: The returned JSON data is parsed and dynamically styled into paragraphs, MCQ lists, or flashcard cards, and loaded directly into the DOM output container.
