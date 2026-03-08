import { DialogueMessage } from '../dialogue/dialogue-script.js';
import './dialogue-box.css';

/**
 * Reusable dialogue box UI component.
 * Creates and manages a chat-like dialogue interface similar to iMessage/Messenger.
 */
export class DialogueBox {
    private container: HTMLDivElement;
    private messagesContainer: HTMLDivElement;
    private portraitElement: HTMLImageElement;
    private typingIndicator: HTMLDivElement;
    private typingAvatar: HTMLDivElement;
    private exitButton: HTMLButtonElement;
    private isVisible: boolean = false;
    private onExitCallback: (() => void) | null = null;
    private portraitCache: Map<string, string> = new Map();
    private messageElements: HTMLDivElement[] = [];

    constructor() {
        this.container = document.createElement('div');
        this.container.classList.add('dialogue-container');

        this.portraitElement = document.createElement('img');
        this.portraitElement.classList.add('dialogue-portrait');

        this.messagesContainer = document.createElement('div');
        this.messagesContainer.classList.add('dialogue-messages');
        this.container.appendChild(this.messagesContainer);

        // Typing indicator
        this.typingIndicator = document.createElement('div');
        this.typingIndicator.classList.add('dialogue-typing');

        this.typingAvatar = document.createElement('div');
        this.typingAvatar.classList.add('dialogue-typing-avatar');
        this.typingIndicator.appendChild(this.typingAvatar);

        const typingBubble = document.createElement('div');
        typingBubble.classList.add('dialogue-typing-bubble');
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.textContent = '\u25CF';
            dot.classList.add('dialogue-typing-dot');
            dot.style.animationDelay = `${i * 0.2}s`;
            typingBubble.appendChild(dot);
        }
        this.typingIndicator.appendChild(typingBubble);
        this.messagesContainer.appendChild(this.typingIndicator);

        // Exit button
        this.exitButton = document.createElement('button');
        this.exitButton.textContent = 'Exit';
        this.exitButton.classList.add('dialogue-exit');
        this.exitButton.addEventListener('click', () => {
            if (this.onExitCallback) {
                this.onExitCallback();
            }
        });

        this.container.appendChild(this.exitButton);
        document.body.appendChild(this.container);
    }

    /**
     * Shows the dialogue box and initializes a new conversation.
     */
    public show(message: DialogueMessage): void {
        this.clearMessages();

        const portraitUrl = this.getPortraitForEmotion(message.emotion || 'default');
        this.portraitElement.src = portraitUrl;

        this.addMessage(message);

        this.isVisible = true;
        this.container.classList.add('visible');

        this.exitButton.classList.remove('visible');
    }

    /**
     * Adds a new message to the chat history.
     * Only keeps the 3 most recent messages visible.
     */
    public addMessage(message: DialogueMessage): void {
        this.typingIndicator.classList.remove('visible');

        while (this.messageElements.length >= 3) {
            const oldestMessage = this.messageElements.shift();
            if (oldestMessage && oldestMessage.parentElement) {
                oldestMessage.parentElement.removeChild(oldestMessage);
            }
        }

        this.updateMessageOpacities();

        const messageRow = document.createElement('div');
        messageRow.classList.add('dialogue-row');

        const avatar = document.createElement('img');
        avatar.src = this.getPortraitForEmotion(message.emotion || 'default');
        avatar.classList.add('dialogue-avatar');
        messageRow.appendChild(avatar);

        const messageBubble = document.createElement('div');
        messageBubble.classList.add('dialogue-bubble');
        messageBubble.textContent = message.text;
        messageRow.appendChild(messageBubble);

        this.messagesContainer.insertBefore(messageRow, this.typingIndicator);
        this.messageElements.push(messageRow);
    }

    /**
     * Updates the opacity of existing messages based on their age.
     * Newest message: 1.0, second: 0.7, third: 0.4
     */
    private updateMessageOpacities(): void {
        const totalMessages = this.messageElements.length;
        this.messageElements.forEach((messageRow, index) => {
            const positionFromNewest = totalMessages - index;
            let opacity = 1.0;

            if (positionFromNewest === 1) {
                opacity = 1.0;
            } else if (positionFromNewest === 2) {
                opacity = 0.7;
            } else if (positionFromNewest === 3) {
                opacity = 0.4;
            }

            messageRow.style.opacity = opacity.toString();
        });
    }

    /**
     * Shows the typing indicator.
     */
    public showTypingIndicator(): void {
        if (this.portraitElement.src) {
            this.typingAvatar.style.backgroundImage = `url(${this.portraitElement.src})`;
        }
        this.typingIndicator.classList.add('visible');
    }

    /**
     * Hides the typing indicator.
     */
    public hideTypingIndicator(): void {
        this.typingIndicator.classList.remove('visible');
    }

    /**
     * Shows the exit button (called when dialogue is finished).
     */
    public showExitButton(): void {
        this.exitButton.classList.add('visible');
        this.hideTypingIndicator();
    }

    /**
     * Clears all messages from the chat.
     */
    private clearMessages(): void {
        this.messageElements.forEach(el => {
            if (el.parentElement) {
                el.parentElement.removeChild(el);
            }
        });
        this.messageElements = [];
    }

    /**
     * Hides the dialogue box.
     */
    public hide(): void {
        this.isVisible = false;
        this.container.classList.remove('visible');
        this.clearMessages();
        this.hideTypingIndicator();
        this.exitButton.classList.remove('visible');
    }

    /**
     * Sets the callback for when the exit button is clicked.
     */
    public setOnExit(callback: () => void): void {
        this.onExitCallback = callback;
    }

    /**
     * Gets portrait image URL based on emotion string.
     */
    private getPortraitForEmotion(emotion: string): string {
        const emotionKey = emotion.toLowerCase();

        if (this.portraitCache.has(emotionKey)) {
            return this.portraitCache.get(emotionKey)!;
        }

        const portraitConfig: { [key: string]: { color: string; emoji: string } } = {
            'happy': { color: '#FFE5B4', emoji: '\u{1F60A}' },
            'excited': { color: '#FFB6C1', emoji: '\u{1F389}' },
            'friendly': { color: '#FFD700', emoji: '\u{1F44B}' },
            'surprised': { color: '#FF69B4', emoji: '\u{1F632}' },
            'sad': { color: '#87CEEB', emoji: '\u{1F622}' },
            'angry': { color: '#FF6347', emoji: '\u{1F620}' },
            'default': { color: '#DDA0DD', emoji: '\u{1F464}' }
        };

        const config = portraitConfig[emotionKey] || portraitConfig['default'];
        const portraitUrl = this.createPlaceholderPortrait(config.color, config.emoji);

        this.portraitCache.set(emotionKey, portraitUrl);

        return portraitUrl;
    }

    /**
     * Creates a placeholder portrait as a data URL.
     */
    private createPlaceholderPortrait(bgColor: string, emoji: string): string {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, 100, 100);

            ctx.font = '60px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, 50, 50);
        }

        return canvas.toDataURL();
    }

    /**
     * Checks if the dialogue box is currently visible.
     */
    public getVisible(): boolean {
        return this.isVisible;
    }

    /**
     * Disposes of the dialogue box.
     */
    public dispose(): void {
        if (this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
        }
    }
}
