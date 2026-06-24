// ==========================================================================
// Smart Notes AI - Main Application Logic
// ==========================================================================

// ⚠️ IMPORTANT: Replace this placeholder with your actual Gemini API key.
// You can get a free key from Google AI Studio (https://aistudio.google.com/)
const GEMINI_API_KEY = "PASTE_YOUR_API_KEY_HERE";

// DOM Elements
const notesInput = document.getElementById("notes-input");
const btnSummarize = document.getElementById("btn-summarize");
const btnMCQs = document.getElementById("btn-mcqs");
const btnFlashcards = document.getElementById("btn-flashcards");

const outputPlaceholder = document.getElementById("output-placeholder");
const outputLoading = document.getElementById("output-loading");
const outputError = document.getElementById("output-error");
const outputContent = document.getElementById("output-content");

const loadingText = document.getElementById("loading-text");
const errorMessage = document.getElementById("error-message");

// Event Listeners for action buttons
btnSummarize.addEventListener("click", () => handleAction("summarize"));
btnMCQs.addEventListener("click", () => handleAction("mcqs"));
btnFlashcards.addEventListener("click", () => handleAction("flashcards"));

/**
 * Main coordinator function that validates inputs, displays loading status,
 * makes the API call, and displays results.
 * @param {string} actionType - The type of action to perform ('summarize', 'mcqs', 'flashcards')
 */
async function handleAction(actionType) {
    const notesText = notesInput.value.trim();

    // 1. Validation: Prevent empty textarea submissions
    if (!notesText) {
        showError("Please paste or type some study notes before submitting.");
        return;
    }

    if (notesText.length < 20) {
        showError("Your notes are too short. Please enter at least 20 characters for meaningful AI results.");
        return;
    }

    // 2. Setup API Key Verification
    if (GEMINI_API_KEY === "YOUR_API_KEY_HERE" || !GEMINI_API_KEY.trim()) {
        showError(
            "API Key missing! Please open 'script.js' and replace the variable GEMINI_API_KEY value at line 6 with your actual Google Gemini API key."
        );
        return;
    }

    // 3. UI State: Show Loading and hide previous states
    showLoading(actionType);

    try {
        // Prepare prompt and request schema depending on action
        const apiPayload = getApiPayload(actionType, notesText);
        
        // 4. API Call using native fetch()
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(apiPayload)
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const apiMsg = errorData.error?.message || `HTTP error! status: ${response.status}`;
            throw new Error(apiMsg);
        }

        const responseData = await response.json();
        
        // Extract raw text response containing our JSON
        const rawJsonText = responseData.candidates[0].content.parts[0].text;
        const parsedResult = JSON.parse(rawJsonText);

        // 5. Render Output
        renderOutput(actionType, parsedResult);

    } catch (error) {
        console.error("API Error Details:", error);
        showError(`AI generation failed: ${error.message}`);
    }
}

/**
 * Build the payload and request structure for Gemini API.
 * Uses structured JSON outputs for reliable parsing.
 */
function getApiPayload(actionType, notes) {
    let promptText = "";
    
    switch (actionType) {
        case "summarize":
            promptText = `You are a study assistant. Summarize the following study notes in a clean, concise paragraph. Your output must be a JSON object containing a "summary" field (string) with the summarized text.\n\nNotes:\n${notes}`;
            break;
        case "mcqs":
            promptText = `You are a study assistant. Generate exactly 5 multiple-choice questions based on the following study notes. For each question, provide 4 distinct options and clearly specify which option is the correct answer. Your output must be a JSON array of objects. Each object in the array must have these keys:\n- "question" (string)\n- "options" (array of 4 strings)\n- "answer" (string, the correct option text)\n\nNotes:\n${notes}`;
            break;
        case "flashcards":
            promptText = `You are a study assistant. Generate exactly 5 flashcards based on the following study notes. Each flashcard should test a key concept. Your output must be a JSON array of objects. Each object in the array must have these keys:\n- "question" (string)\n- "answer" (string)\n\nNotes:\n${notes}`;
            break;
    }

    return {
        contents: [
            {
                parts: [
                    { text: promptText }
                ]
            }
        ],
        // Generation Configuration requests JSON format directly from Gemini
        generationConfig: {
            responseMimeType: "application/json"
        }
    };
}

/**
 * Handle HTML rendering depending on the selected action
 */
function renderOutput(actionType, data) {
    // Hide loading, error, and placeholder
    hideAllStates();
    outputContent.classList.remove("hidden");
    outputContent.innerHTML = ""; // Clear old outputs

    if (actionType === "summarize") {
        // Summary Formatting
        const summaryHtml = `
            <div class="summary-container">
                <h3 class="summary-title">Summary</h3>
                <p class="summary-paragraph">${escapeHtml(data.summary)}</p>
            </div>
        `;
        outputContent.innerHTML = summaryHtml;

    } else if (actionType === "mcqs") {
        // MCQs Formatting
        const mcqContainer = document.createElement("div");
        mcqContainer.className = "mcq-container";

        // Expecting an array of 5 questions
        const questions = Array.isArray(data) ? data : (data.questions || []);

        questions.forEach((q, idx) => {
            const mcqItem = document.createElement("div");
            mcqItem.className = "mcq-item";

            // Generate option elements
            const optionsListHtml = q.options.map(option => `
                <li class="mcq-option">
                    <strong>${escapeHtml(option)}</strong>
                </li>
            `).join("");

            mcqItem.innerHTML = `
                <h4 class="mcq-question">${idx + 1}. ${escapeHtml(q.question)}</h4>
                <ul class="mcq-options">
                    ${optionsListHtml}
                </ul>
                <div class="mcq-answer">Correct Answer: ${escapeHtml(q.answer)}</div>
            `;
            mcqContainer.appendChild(mcqItem);
        });

        outputContent.appendChild(mcqContainer);

    } else if (actionType === "flashcards") {
        // Flashcards Formatting
        const flashcardsContainer = document.createElement("div");
        flashcardsContainer.className = "flashcards-container";

        // Expecting an array of 5 cards
        const cards = Array.isArray(data) ? data : (data.flashcards || []);

        cards.forEach(card => {
            const flashcardDiv = document.createElement("div");
            flashcardDiv.className = "flashcard";

            flashcardDiv.innerHTML = `
                <div>
                    <span class="label-title">Question</span>
                    <p class="flashcard-q">${escapeHtml(card.question)}</p>
                </div>
                <div class="flashcard-a">
                    <span class="label-title">Answer</span>
                    <p>${escapeHtml(card.answer)}</p>
                </div>
            `;
            flashcardsContainer.appendChild(flashcardDiv);
        });

        outputContent.appendChild(flashcardsContainer);
    }
}

/**
 * Show loading spinner and adjust text depending on the request
 */
function showLoading(actionType) {
    hideAllStates();
    outputLoading.classList.remove("hidden");
    
    let text = "Gemini is thinking and preparing your content...";
    if (actionType === "summarize") text = "Summarizing your notes...";
    if (actionType === "mcqs") text = "Generating 5 multiple-choice questions...";
    if (actionType === "flashcards") text = "Designing 5 custom flashcards...";

    loadingText.textContent = text;
}

/**
 * Show error block with custom text
 */
function showError(message) {
    hideAllStates();
    outputError.classList.remove("hidden");
    errorMessage.textContent = message;
}

/**
 * Helper to hide all feedback states
 */
function hideAllStates() {
    outputPlaceholder.classList.add("hidden");
    outputLoading.classList.add("hidden");
    outputError.classList.add("hidden");
    outputContent.classList.add("hidden");
}

/**
 * Simple HTML sanitizer to avoid breaking the layout and protect against XSS
 */
function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
