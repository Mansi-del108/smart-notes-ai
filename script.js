// ==========================================================================
// Smart Notes AI - Main Application Logic (Vercel & note manager)
// ==========================================================================

// Global state variables
let notesList = [];
let activeNoteId = null;

// DOM Elements (will be initialized when DOM is ready)
let notesInput;
let btnSummarize;
let btnMCQs;
let btnFlashcards;
let btnSave;
let btnNew;
let notesListContainer;
let apiKeyInput;

let outputPlaceholder;
let outputLoading;
let outputError;
let outputContent;
let loadingText;
let errorMessage;

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize DOM references safely
    notesInput = document.getElementById("notes-input");
    btnSummarize = document.getElementById("btn-summarize");
    btnMCQs = document.getElementById("btn-mcqs");
    btnFlashcards = document.getElementById("btn-flashcards");
    btnSave = document.getElementById("btn-save");
    btnNew = document.getElementById("btn-new");
    notesListContainer = document.getElementById("notes-list");
    apiKeyInput = document.getElementById("api-key-input");

    outputPlaceholder = document.getElementById("output-placeholder");
    outputLoading = document.getElementById("output-loading");
    outputError = document.getElementById("output-error");
    outputContent = document.getElementById("output-content");
    loadingText = document.getElementById("loading-text");
    errorMessage = document.getElementById("error-message");

    // 2. Load storage data
    loadNotesFromStorage();
    renderNotesList();
    loadApiKeyFromStorage();

    // 3. Register Event Listeners
    btnSave.addEventListener("click", saveNote);
    btnNew.addEventListener("click", startNewNote);
    apiKeyInput.addEventListener("input", saveApiKeyToStorage);

    btnSummarize.addEventListener("click", () => handleAiAction("summarize"));
    btnMCQs.addEventListener("click", () => handleAiAction("mcqs"));
    btnFlashcards.addEventListener("click", () => handleAiAction("flashcards"));
});

// ==========================================================================
// Notes Library Features (LocalStorage Persistence)
// ==========================================================================

/**
 * Loads notes from localStorage
 */
function loadNotesFromStorage() {
    try {
        const savedNotes = localStorage.getItem("smart_notes_list");
        notesList = savedNotes ? JSON.parse(savedNotes) : [];
    } catch (e) {
        console.error("Failed to load notes from localStorage:", e);
        notesList = [];
    }
}

/**
 * Saves current notes array to localStorage
 */
function saveNotesToStorage() {
    try {
        localStorage.setItem("smart_notes_list", JSON.stringify(notesList));
    } catch (e) {
        console.error("Failed to save notes to localStorage:", e);
    }
}

/**
 * Loads custom API Key from localStorage
 */
function loadApiKeyFromStorage() {
    if (!apiKeyInput) return;
    const savedKey = localStorage.getItem("smart_notes_custom_key");
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }
}

/**
 * Saves custom API Key to localStorage when updated
 */
function saveApiKeyToStorage() {
    if (!apiKeyInput) return;
    localStorage.setItem("smart_notes_custom_key", apiKeyInput.value.trim());
}

/**
 * Renders notes list inside the sidebar
 */
function renderNotesList() {
    if (!notesListContainer) return;
    notesListContainer.innerHTML = "";

    if (notesList.length === 0) {
        notesListContainer.innerHTML = `<div class="empty-list-msg">No saved notes yet.</div>`;
        return;
    }

    notesList.forEach(note => {
        const noteItem = document.createElement("div");
        noteItem.className = `note-item ${note.id === activeNoteId ? "active" : ""}`;
        
        noteItem.addEventListener("click", (e) => {
            if (e.target.closest(".delete-btn")) return;
            selectNote(note.id);
        });

        const titleWrapper = document.createElement("div");
        titleWrapper.className = "note-title-wrapper";
        titleWrapper.textContent = note.title;
        titleWrapper.title = note.content;

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.innerHTML = "🗑️";
        deleteBtn.title = "Delete Note";
        deleteBtn.addEventListener("click", () => deleteNote(note.id));

        noteItem.appendChild(titleWrapper);
        noteItem.appendChild(deleteBtn);
        notesListContainer.appendChild(noteItem);
    });
}

/**
 * Select and load a note into the editor
 */
function selectNote(id) {
    const note = notesList.find(n => n.id === id);
    if (!note) return;

    activeNoteId = id;
    if (notesInput) {
        notesInput.value = note.content;
    }
    
    renderNotesList();
    hideAllStates();
    if (outputPlaceholder) {
        outputPlaceholder.classList.remove("hidden");
    }
}

/**
 * Saves the note currently in the textarea
 */
function saveNote() {
    if (!notesInput) return;
    const textContent = notesInput.value.trim();

    if (!textContent) {
        showError("Cannot save an empty note.");
        return;
    }

    let title = textContent.split("\n")[0].substring(0, 25).trim();
    if (!title) {
        title = "Untitled Note";
    } else if (textContent.length > 25) {
        title += "...";
    }

    if (activeNoteId) {
        const noteIndex = notesList.findIndex(n => n.id === activeNoteId);
        if (noteIndex !== -1) {
            notesList[noteIndex].content = textContent;
            notesList[noteIndex].title = title;
            notesList[noteIndex].updatedAt = Date.now();
        }
    } else {
        const newNote = {
            id: "note_" + Date.now(),
            title: title,
            content: textContent,
            updatedAt: Date.now()
        };
        notesList.unshift(newNote);
        activeNoteId = newNote.id;
    }

    saveNotesToStorage();
    renderNotesList();
    
    if (btnSave) {
        btnSave.classList.add("btn-success-outline");
        setTimeout(() => btnSave.classList.remove("btn-success-outline"), 1000);
    }
}

/**
 * Clears active selection and editor
 */
function startNewNote() {
    activeNoteId = null;
    if (notesInput) {
        notesInput.value = "";
        notesInput.focus();
    }
    renderNotesList();
    hideAllStates();
    if (outputPlaceholder) {
        outputPlaceholder.classList.remove("hidden");
    }
}

/**
 * Deletes a note
 */
function deleteNote(id) {
    notesList = notesList.filter(n => n.id !== id);
    saveNotesToStorage();

    if (activeNoteId === id) {
        activeNoteId = null;
        if (notesInput) {
            notesInput.value = "";
        }
        hideAllStates();
        if (outputPlaceholder) {
            outputPlaceholder.classList.remove("hidden");
        }
    }

    renderNotesList();
}

// ==========================================================================
// AI Functions (Calling Proxy / Direct Endpoint)
// ==========================================================================

/**
 * Coordinates AI requests, calls endpoints, and displays results.
 */
async function handleAiAction(actionType) {
    if (!notesInput || !apiKeyInput) return;
    
    const notesText = notesInput.value.trim();
    const userApiKey = apiKeyInput.value.trim();

    // 1. Input validations
    if (!notesText) {
        showError("Please paste or type some study notes before submitting.");
        return;
    }

    if (notesText.length < 20) {
        showError("Your notes are too short. Please enter at least 20 characters for meaningful AI results.");
        return;
    }

    showLoading(actionType);

    try {
        let response;
        
        if (userApiKey) {
            // Path A: Client-side direct call (For GitHub Pages deployment using user's key)
            const promptText = getPromptText(actionType, notesText);
            const apiPayload = {
                contents: [{ parts: [{ text: promptText }] }]
            };
            
            response = await fetch(
                `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${userApiKey}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(apiPayload)
                }
            );
        } else {
            // Path B: Vercel Serverless Proxy call (Uses env GEMINI_API_KEY on server)
            response = await fetch("/api/summarize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text: notesText,
                    type: actionType
                })
            });
        }

        // 3. Response validation
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const serverErrorMsg = errorData.error?.message || `Server returned HTTP status ${response.status}`;
            throw new Error(serverErrorMsg);
        }

        const responseData = await response.json();
        let parsedResult;

        // 4. Output parsing
        if (userApiKey) {
            const rawJsonText = responseData.candidates[0].content.parts[0].text;
            let cleanJsonText = rawJsonText.trim();
            
            // Strip markdown formatting if the model wraps JSON in backticks
            if (cleanJsonText.startsWith("```")) {
                cleanJsonText = cleanJsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
            }
            parsedResult = JSON.parse(cleanJsonText.trim());
        } else {
            parsedResult = responseData;
        }

        // 5. Render
        renderOutput(actionType, parsedResult);

    } catch (error) {
        console.error("AI Operations Error:", error);
        showError(`AI generation failed: ${error.message}`);
    }
}

/**
 * Returns prompt instructions based on type
 */
function getPromptText(actionType, notes) {
    switch (actionType) {
        case "summarize":
            return `You are a study assistant. Summarize the following study notes in a clean, concise paragraph. Your output must be a JSON object containing a "summary" field (string) with the summarized text.\n\nNotes:\n${notes}`;
        case "mcqs":
            return `You are a study assistant. Generate exactly 5 multiple-choice questions based on the following study notes. For each question, provide 4 distinct options and clearly specify which option is the correct answer. Your output must be a JSON array of objects. Each object in the array must have these keys:\n- "question" (string)\n- "options" (array of 4 strings)\n- "answer" (string, the correct option text)\n\nNotes:\n${notes}`;
        case "flashcards":
            return `You are a study assistant. Generate exactly 5 flashcards based on the following study notes. Each flashcard should test a key concept. Your output must be a JSON array of objects. Each object in the array must have these keys:\n- "question" (string)\n- "answer" (string)\n\nNotes:\n${notes}`;
        default:
            return `You are a study assistant. Summarize the following study notes in a clean, concise paragraph. Your output must be a JSON object containing a "summary" field (string) with the summarized text.\n\nNotes:\n${notes}`;
    }
}

/**
 * Handle HTML rendering depending on the selected action
 */
function renderOutput(actionType, data) {
    hideAllStates();
    if (!outputContent) return;
    
    outputContent.classList.remove("hidden");
    outputContent.innerHTML = "";

    if (actionType === "summarize") {
        const summaryHtml = `
            <div class="summary-container">
                <h3 class="summary-title">Summary</h3>
                <p class="summary-paragraph">${escapeHtml(data.summary)}</p>
            </div>
        `;
        outputContent.innerHTML = summaryHtml;

    } else if (actionType === "mcqs") {
        const mcqContainer = document.createElement("div");
        mcqContainer.className = "mcq-container";

        const questions = Array.isArray(data) ? data : (data.questions || []);

        questions.forEach((q, idx) => {
            const mcqItem = document.createElement("div");
            mcqItem.className = "mcq-item";

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
        const flashcardsContainer = document.createElement("div");
        flashcardsContainer.className = "flashcards-container";

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
    if (!outputLoading || !loadingText) return;
    
    outputLoading.classList.remove("hidden");
    
    let text = "Gemini is thinking and preparing your content...";
    if (actionType === "summarize") text = "Summarizing active note...";
    if (actionType === "mcqs") text = "Generating 5 multiple-choice questions...";
    if (actionType === "flashcards") text = "Designing 5 custom flashcards...";

    loadingText.textContent = text;
}

/**
 * Show error block with custom text
 */
function showError(message) {
    hideAllStates();
    if (!outputError || !errorMessage) return;
    outputError.classList.remove("hidden");
    errorMessage.textContent = message;
}

/**
 * Helper to hide all feedback states
 */
function hideAllStates() {
    if (outputPlaceholder) outputPlaceholder.classList.add("hidden");
    if (outputLoading) outputLoading.classList.add("hidden");
    if (outputError) outputError.classList.add("hidden");
    if (outputContent) outputContent.classList.add("hidden");
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
