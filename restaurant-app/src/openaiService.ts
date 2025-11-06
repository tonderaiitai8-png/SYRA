import { supabase } from './supabaseClient';
import type { SessionState } from '../shared/aiTypes';

export type { CartItem, SessionState } from '../shared/aiTypes';

interface ProcessAIMessageResponse {
  reply: string;
  session: SessionState;
}

export async function processAIMessage(
  userMessage: string,
  session: SessionState
): Promise<ProcessAIMessageResponse> {
  try {
    const { data, error } = await supabase.functions.invoke<ProcessAIMessageResponse>('ai-chat', {
      body: { session, userMessage }
    });

    if (error) {
      throw new Error(error.message || 'AI service error');
    }

    if (!data) {
      throw new Error('No data returned from AI service');
    }

    return data;
  } catch (error) {
    console.error('AI service error:', error);
    return {
      reply: "I apologize, I'm having trouble processing that right now. Could you try again?",
      session
    };
  }
}
