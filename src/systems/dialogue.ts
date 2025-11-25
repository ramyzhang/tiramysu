import { System } from './system.js';
import { Engine } from '../engine/engine.js';
import { Interactable } from '../entities/interactable.js';
import { DialogueScript } from '../dialogue/dialogue-script.js';
import { getDialogueById } from '../dialogue/game-dialogues.js';
import { DialogueBox } from '../ui/dialogue-box.js';

/**
 * System that handles dialogue display and progression.
 * Listens to interaction events and displays dialogue from scripts.
 */
export class DialogueSystem extends System {
    private dialogueBox: DialogueBox;
    private currentDialogue: DialogueScript | null = null;
    private currentMessageIndex: number = 0;
    private isDialogueActive: boolean = false;
    private autoAdvanceTimer: number | null = null;
    private typingTimer: number | null = null;

    constructor(engine: Engine) {
        super(engine);
        this.dialogueBox = new DialogueBox();
        this.setupInteractionListener();
        this.setupExitHandler();
    }

    /**
     * Sets up listener for interaction events.
     */
    private setupInteractionListener(): void {
        this.engine.world.interactionSystem.on('interactableClicked', (data) => {
            this.startDialogue(data.interactable);
        });
    }

    /**
     * Sets up the exit button handler.
     */
    private setupExitHandler(): void {
        this.dialogueBox.setOnExit(() => {
            this.closeDialogue();
        });
    }

    /**
     * Starts a dialogue for an interactable.
     * Maps interactable names to dialogue IDs.
     */
    private startDialogue(interactable: Interactable): void {
        // Clear any existing timers
        this.clearTimers();
        
        // Map interactable names to dialogue IDs
        // You can extend this to store dialogue ID on the interactable itself
        const dialogueMap: { [key: string]: string } = {
            'Interactable': 'welcome',
            'Mystery Box': 'mystery-box',
            'Berry': 'friendly-npc'
        };

        const dialogueId = dialogueMap[interactable.name] || 'welcome';
        const dialogue = getDialogueById(dialogueId);

        if (dialogue && dialogue.messages.length > 0) {
            this.currentDialogue = dialogue;
            this.currentMessageIndex = 0;
            this.isDialogueActive = true;
            
            // Show first message
            const firstMessage = this.currentDialogue.messages[0];
            this.dialogueBox.show(firstMessage);
            
            // Auto-advance to next message after 1 second
            this.scheduleNextMessage();
        }
    }

    /**
     * Shows the current message in the dialogue.
     */
    private showCurrentMessage(): void {
        if (!this.currentDialogue) return;

        const message = this.currentDialogue.messages[this.currentMessageIndex];
        if (message) {
            this.dialogueBox.addMessage(message);
        }
    }

    /**
     * Schedules the next message to appear after showing typing indicator.
     */
    private scheduleNextMessage(): void {
        if (!this.currentDialogue) return;

        // Clear any existing timers
        this.clearTimers();

        // Check if there are more messages
        if (this.currentMessageIndex + 1 >= this.currentDialogue.messages.length) {
            // No more messages - show exit button
            this.dialogueBox.showExitButton();
            return;
        }

        // Show typing indicator after 1 second
        this.typingTimer = window.setTimeout(() => {
            this.dialogueBox.showTypingIndicator();
            
            // Show next message after typing indicator (simulate typing delay)
            this.autoAdvanceTimer = window.setTimeout(() => {
                this.currentMessageIndex++;
                this.showCurrentMessage();
                
                // Schedule next message
                this.scheduleNextMessage();
            }, 500); // Show message after 0.8s of typing indicator
        }, 1000); // Wait 1 second before showing typing indicator
    }

    /**
     * Clears all active timers.
     */
    private clearTimers(): void {
        if (this.autoAdvanceTimer !== null) {
            clearTimeout(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }
        if (this.typingTimer !== null) {
            clearTimeout(this.typingTimer);
            this.typingTimer = null;
        }
    }

    /**
     * Closes the current dialogue.
     */
    private closeDialogue(): void {
        this.clearTimers();
        this.isDialogueActive = false;
        this.currentDialogue = null;
        this.currentMessageIndex = 0;
        this.dialogueBox.hide();
    }

    update(delta: number): void {
        // No keyboard input needed - dialogue auto-advances
        // Exit button handles closing the dialogue
    }

    /**
     * Checks if dialogue is currently active.
     */
    public isActive(): boolean {
        return this.isDialogueActive;
    }

    /**
     * Cleanup method.
     */
    public dispose(): void {
        this.dialogueBox.dispose();
    }
}

