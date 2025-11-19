import { System } from './system.js';
import { Engine } from '../engine/engine.js';
import { Interactable } from '../entities/interactable.js';
import { DialogueScript, DialogueMessage } from '../dialogue/dialogue-script.js';
import { getDialogueById } from '../dialogue/sample-dialogues.js';
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

    constructor(engine: Engine) {
        super(engine);
        this.dialogueBox = new DialogueBox();
        this.setupInteractionListener();
        this.setupContinueHandler();
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
     * Sets up the continue button handler.
     */
    private setupContinueHandler(): void {
        this.dialogueBox.setOnContinue(() => {
            this.nextMessage();
        });
    }

    /**
     * Starts a dialogue for an interactable.
     * Maps interactable names to dialogue IDs.
     */
    private startDialogue(interactable: Interactable): void {
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
            this.showCurrentMessage();
        }
    }

    /**
     * Shows the current message in the dialogue.
     */
    private showCurrentMessage(): void {
        if (!this.currentDialogue) return;

        const message = this.currentDialogue.messages[this.currentMessageIndex];
        if (message) {
            this.dialogueBox.show(message, this.currentDialogue.name);
        }
    }

    /**
     * Advances to the next message or closes dialogue if finished.
     */
    private nextMessage(): void {
        if (!this.currentDialogue) return;

        this.currentMessageIndex++;

        if (this.currentMessageIndex >= this.currentDialogue.messages.length) {
            // Dialogue finished
            this.closeDialogue();
        } else {
            // Show next message
            this.showCurrentMessage();
        }
    }

    /**
     * Closes the current dialogue.
     */
    private closeDialogue(): void {
        this.isDialogueActive = false;
        this.currentDialogue = null;
        this.currentMessageIndex = 0;
        this.dialogueBox.hide();
    }

    private wasSpacePressed: boolean = false;
    private wasEnterPressed: boolean = false;

    update(delta: number): void {
        // Check for keyboard input to continue dialogue
        if (this.isDialogueActive) {
            const input = this.engine.input;
            // Allow Space or Enter to continue dialogue
            const spacePressed = input.isKeyPressed(' ');
            const enterPressed = input.isKeyPressed('Enter');
            
            // Only trigger on new key press, not hold
            if ((spacePressed && !this.wasSpacePressed) || (enterPressed && !this.wasEnterPressed)) {
                this.nextMessage();
            }
            
            this.wasSpacePressed = spacePressed;
            this.wasEnterPressed = enterPressed;
        } else {
            // Reset key states when dialogue is not active
            this.wasSpacePressed = false;
            this.wasEnterPressed = false;
        }
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

