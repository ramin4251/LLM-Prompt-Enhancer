function addEnhanceButton() {
    // Modified selector to include contenteditable divs
    const textareas = document.querySelectorAll('textarea, div[contenteditable="true"]');

    for (let textarea of textareas) {
        if (!textarea.dataset.enhanceButtonAdded) {
            const button = document.createElement('button');
            button.className = 'enhance-button';
            button.style.margin = '5px';

            // Add these lines to center the text
            button.style.display = 'flex';        // Enable flexbox layout
            button.style.justifyContent = 'center'; // Center horizontally
            button.style.alignItems = 'center';     // Center vertically

            button.textContent = 'Enhance Prompt';

            button.onclick = async () => {
                const originalText = textarea.textContent || textarea.value; // Handle both textarea and contenteditable div
                if (originalText.trim()) {
                    try {
                        button.textContent = 'Enhancing...';
                        button.disabled = true;

                        chrome.storage.local.get(['groqApiKey'], async function(result) {
                            const apiKey = result.groqApiKey;
                            if (!apiKey) {
                                alert('Groq API Key is not set. Please open the extension popup and set your Groq API Key.');
                                button.textContent = 'Enhance Prompt';
                                button.disabled = false;
                                return;
                            }
                            try {
                                const enhancedText = await enhanceText(originalText, apiKey);
                                // Handle setting value for both textarea and contenteditable div
                                if (textarea.tagName === 'TEXTAREA') {
                                    textarea.value = enhancedText;
                                } else {
                                    textarea.textContent = enhancedText;
                                }

                                // --- Dispatch an 'input' event ---
                                textarea.dispatchEvent(new InputEvent('input', {
                                    bubbles: true,
                                    cancelable: true,
                                }));
                                // ----------------------------------


                            } catch (error) {
                                console.error('Error enhancing text:', error);
                                alert('Failed to enhance prompt. Please try again.');
                            } finally {
                                button.textContent = 'Enhance Prompt';
                                button.disabled = false;
                            }
                        });

                    } catch (error) {
                        console.error('Error starting enhancement process:', error);
                        button.textContent = 'Enhance Prompt';
                        button.disabled = false;
                    }
                }
            };

            textarea.parentNode.insertBefore(button, textarea.nextSibling);
            textarea.dataset.enhanceButtonAdded = 'true';
        }
    }
}

async function enhanceText(text, apiKey) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'mixtral-8x7b-32768',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert prompt engineer. Your goal is to improve user-provided text to be a highly effective prompt for a chat-based LLM. Focus on clarity, conciseness, and actionable instructions. Return ONLY the enhanced prompt, structured for optimal LLM understanding. No extra commentary or explanations.'
                },
                {
                    role: 'user',
                    content: `Please enhance the following text into a structured and effective prompt for a Large Language Model.

                    **Original Text:**
                    "${text}"

                    **Enhanced Prompt Structure (Use these sections):**

                    --- Task ---
                    [Clearly define the task using action verbs]

                    --- Instructions ---
                    [Provide concise, numbered instructions for the LLM to follow. Be direct and use imperative language. Focus on how to process the original text and what kind of output is expected.  For example:
                    1. Analyze the Original Text to understand the user's intent.
                    2. Based on the intent, formulate a clear and concise Task statement.
                    3. Provide specific, step-by-step instructions to guide the LLM.
                    4. Specify the desired output format if necessary.]

                    --- Context (Original Text) ---
                    [Include the original text here for the LLM's reference.]


                    **Example Enhanced Prompt (for input: 'Explain quantum physics'):**

                    --- Task ---
                    Explain the basics of quantum physics.

                    --- Instructions ---
                    1. Start with a simple definition of quantum physics.
                    2. Explain key concepts like superposition and entanglement.
                    3. Use analogies and examples to make it understandable for someone with no prior knowledge.
                    4. Keep the explanation concise and avoid overly technical jargon.

                    --- Context (Original Text) ---
                    Explain quantum physics


                    Now, enhance the prompt for the following Original Text.  Remember to ONLY return the enhanced prompt structured as shown above.  Do not include any extra text or explanations.
                    `
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
}

// Run on page load and watch for dynamic content
addEnhanceButton();
const observer = new MutationObserver(addEnhanceButton);
observer.observe(document.body, { childList: true, subtree: true });