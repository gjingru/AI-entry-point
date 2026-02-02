// OpenAI API utility functions

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

/**
 * Send a chat message to OpenAI API
 * Note: For production, you should use a backend proxy to keep your API key secure
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  apiKey?: string
): Promise<string> {
  const key = apiKey || import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!key) {
    throw new Error('OpenAI API key is required. Set VITE_OPENAI_API_KEY in your .env file or pass it as a parameter.');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using gpt-4o-mini for cost efficiency, can change to gpt-4o or gpt-3.5-turbo
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `OpenAI API error: ${response.status} ${response.statusText}`
      );
    }

    const data: OpenAIResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenAI');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

/**
 * Create a system prompt for hiring assistant
 */
export function createHiringSystemPrompt(missingFields: string[]): string {
  const fieldsList = missingFields.length > 0 
    ? `Missing required fields: ${missingFields.join(', ')}`
    : 'All required fields have been collected.';

  return `You are a helpful hiring assistant for Rippling. Your job is to help collect information needed to create a draft hire.

${fieldsList}

When the user provides information, extract and format it clearly. For example:
- If they say "First name is John", respond with "First name: John"
- If they provide a date like "12/12/28", format it as "Start date: 12/12/28"
- If they provide an email, format it as "Invite email: [email]"

Be conversational and helpful. Ask for missing information one field at a time if possible.`;
}


