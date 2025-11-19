/**
 * Dialogue script data structure.
 * Represents a conversation with a character or object.
 */
export interface DialogueScript {
    id: string;
    name: string; // Character/object name
    messages: DialogueMessage[];
}

export interface DialogueMessage {
    text: string;
    speaker?: string; // Optional: if different from dialogue name
    emotion?: string; // Optional: for character expressions
}

