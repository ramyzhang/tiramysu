import { DialogueMessage } from '../dialogue/dialogue-script.js';

/**
 * Reusable dialogue box UI component.
 * Creates and manages a chat-like dialogue interface similar to iMessage/Messenger.
 */
export class DialogueBox {
    private container: HTMLDivElement;
    private messagesContainer: HTMLDivElement;
    private portraitElement: HTMLImageElement;
    private typingIndicator: HTMLDivElement;
    private exitButton: HTMLButtonElement;
    private isVisible: boolean = false;
    private onExitCallback: (() => void) | null = null;
    private portraitCache: Map<string, string> = new Map();
    private currentSpeakerName: string = '';
    private messageElements: HTMLDivElement[] = [];

    constructor() {
        // Create main container (chat-like interface - transparent background)
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.bottom = '40px';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        this.container.style.width = '500px';
        this.container.style.maxWidth = 'calc(100vw - 40px)';
        this.container.style.maxHeight = '60vh';
        this.container.style.boxSizing = 'border-box';
        this.container.style.background = 'transparent';
        this.container.style.padding = '20px';
        this.container.style.fontFamily = "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
        this.container.style.zIndex = '100000';
        this.container.style.opacity = '0';
        this.container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        this.container.style.transform = 'translateX(-50%) translateY(20px)';
        this.container.style.pointerEvents = 'none';
        this.container.style.userSelect = 'none';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.gap = '12px';

        // Create portrait element (avatar)
        this.portraitElement = document.createElement('img');
        this.portraitElement.style.width = '50px';
        this.portraitElement.style.height = '50px';
        this.portraitElement.style.borderRadius = '50%';
        this.portraitElement.style.objectFit = 'cover';
        this.portraitElement.style.border = '3px solid rgba(255, 255, 255, 0.95)';
        this.portraitElement.style.boxShadow = '0 4px 12px rgba(255, 107, 181, 0.3)';
        this.portraitElement.style.flexShrink = '0';
        this.portraitElement.style.background = 'rgba(255, 255, 255, 0.4)';
        this.portraitElement.style.transition = 'transform 0.2s ease';
        this.portraitElement.style.display = 'none'; // Will be shown in message rows

        // Create messages container (no scrolling needed - only 3 messages visible)
        this.messagesContainer = document.createElement('div');
        this.messagesContainer.style.flex = '1';
        this.messagesContainer.style.display = 'flex';
        this.messagesContainer.style.flexDirection = 'column';
        this.messagesContainer.style.gap = '10px';
        this.messagesContainer.style.overflow = 'hidden';
        this.messagesContainer.style.justifyContent = 'flex-end';
        
        this.container.appendChild(this.messagesContainer);

        // Create typing indicator (structured like a message row)
        this.typingIndicator = document.createElement('div');
        this.typingIndicator.style.display = 'none';
        this.typingIndicator.style.flexDirection = 'row';
        this.typingIndicator.style.gap = '10px';
        this.typingIndicator.style.alignItems = 'flex-start';
        this.setupTypingIndicator();
        this.messagesContainer.appendChild(this.typingIndicator);

        // Create exit button (hidden by default, shown at end)
        this.exitButton = document.createElement('button');
        this.exitButton.textContent = 'Exit';
        this.exitButton.style.width = '100%';
        this.exitButton.style.padding = '12px 24px';
        this.exitButton.style.background = 'linear-gradient(135deg, #FFFFFF 0%, #FFF0F5 100%)';
        this.exitButton.style.border = '2px solid #FFB6C1';
        this.exitButton.style.borderRadius = '16px';
        this.exitButton.style.fontSize = '16px';
        this.exitButton.style.fontWeight = '600';
        this.exitButton.style.color = '#8B4513';
        this.exitButton.style.cursor = 'pointer';
        this.exitButton.style.fontFamily = 'inherit';
        this.exitButton.style.boxShadow = '0 4px 12px rgba(255, 182, 193, 0.4)';
        this.exitButton.style.display = 'none';
        this.exitButton.style.marginTop = '8px';
        this.exitButton.style.transition = 'all 0.2s ease';
        
        this.exitButton.addEventListener('mouseenter', () => {
            this.exitButton.style.background = 'linear-gradient(135deg, #FFFFFF 0%, #FFE4E1 100%)';
            this.exitButton.style.borderColor = '#FF91A4';
            this.exitButton.style.transform = 'translateY(-2px)';
            this.exitButton.style.boxShadow = '0 6px 20px rgba(255, 182, 193, 0.6)';
        });
        
        this.exitButton.addEventListener('mouseleave', () => {
            this.exitButton.style.background = 'linear-gradient(135deg, #FFFFFF 0%, #FFF0F5 100%)';
            this.exitButton.style.borderColor = '#FFB6C1';
            this.exitButton.style.transform = 'translateY(0)';
            this.exitButton.style.boxShadow = '0 4px 12px rgba(255, 182, 193, 0.4)';
        });
        
        this.exitButton.addEventListener('click', () => {
            if (this.onExitCallback) {
                this.onExitCallback();
            }
        });

        this.container.appendChild(this.exitButton);
        document.body.appendChild(this.container);
    }

    /**
     * Sets up the typing indicator with three animated dots.
     */
    private setupTypingIndicator(): void {
        // Check if keyframes already exist
        if (document.getElementById('dialogue-typing-keyframes')) {
            return;
        }

        // Create style element with keyframes
        const style = document.createElement('style');
        style.id = 'dialogue-typing-keyframes';
        style.textContent = `
            @keyframes dialogue-typing-dot {
                0%, 60%, 100% {
                    transform: translateY(0);
                    opacity: 0.7;
                }
                30% {
                    transform: translateY(-10px);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        // Create typing indicator structure (avatar + bubble)
        this.typingIndicator.innerHTML = '';
        this.typingIndicator.style.display = 'flex';
        
        // Create placeholder avatar (will use current portrait)
        const typingAvatar = document.createElement('div');
        typingAvatar.style.width = '40px';
        typingAvatar.style.height = '40px';
        typingAvatar.style.borderRadius = '50%';
        typingAvatar.style.border = '2px solid rgba(255, 255, 255, 0.95)';
        typingAvatar.style.boxShadow = '0 2px 8px rgba(255, 107, 181, 0.2)';
        typingAvatar.style.flexShrink = '0';
        typingAvatar.style.background = 'rgba(255, 255, 255, 0.4)';
        this.typingIndicator.appendChild(typingAvatar);
        
        // Create typing bubble with gradient
        const typingBubble = document.createElement('div');
        typingBubble.style.padding = '12px 16px';
        typingBubble.style.background = 'linear-gradient(135deg, rgba(255, 229, 180, 0.9) 0%, rgba(255, 182, 193, 0.9) 50%, rgba(255, 209, 220, 0.9) 100%)';
        typingBubble.style.borderRadius = '18px';
        typingBubble.style.boxShadow = '0 2px 8px rgba(255, 107, 181, 0.3)';
        typingBubble.style.width = 'fit-content';
        
        // Create three dots
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.textContent = '●';
            dot.style.display = 'inline-block';
            dot.style.margin = '0 2px';
            dot.style.fontSize = '12px';
            dot.style.color = '#8B4513';
            dot.style.animation = `dialogue-typing-dot 1.4s ease-in-out infinite`;
            dot.style.animationDelay = `${i * 0.2}s`;
            typingBubble.appendChild(dot);
        }
        
        this.typingIndicator.appendChild(typingBubble);
        
        // Store avatar reference to update it when showing
        (this.typingIndicator as any).avatarElement = typingAvatar;
    }


    /**
     * Shows the dialogue box and initializes a new conversation.
     */
    public show(message: DialogueMessage, speakerName: string): void {
        // Clear previous messages
        this.clearMessages();
        
        // Store speaker name for avatar
        this.currentSpeakerName = message.speaker || speakerName;
        
        // Set portrait based on emotion
        const portraitUrl = this.getPortraitForEmotion(message.emotion || 'default');
        this.portraitElement.src = portraitUrl;
        
        // Add first message
        this.addMessage(message);
        
        // Show the dialogue box
        this.isVisible = true;
        this.container.style.pointerEvents = 'auto';
        this.container.style.opacity = '1';
        this.container.style.transform = 'translateX(-50%) translateY(0)';
        
        // Hide exit button initially
        this.exitButton.style.display = 'none';
    }

    /**
     * Adds a new message to the chat history.
     * Only keeps the 3 most recent messages visible.
     */
    public addMessage(message: DialogueMessage): void {
        // Hide typing indicator
        this.typingIndicator.style.display = 'none';
        
        // Remove oldest messages if we have more than 2 (keeping 3 total including new one)
        while (this.messageElements.length >= 3) {
            const oldestMessage = this.messageElements.shift();
            if (oldestMessage && oldestMessage.parentElement) {
                oldestMessage.parentElement.removeChild(oldestMessage);
            }
        }
        
        // Update opacity of existing messages (make them more transparent)
        this.updateMessageOpacities();
        
        // Create message row
        const messageRow = document.createElement('div');
        messageRow.style.display = 'flex';
        messageRow.style.gap = '10px';
        messageRow.style.alignItems = 'flex-start';
        messageRow.style.animation = 'fadeInUp 0.3s ease-out';
        messageRow.style.opacity = '1';
        messageRow.style.transition = 'opacity 0.5s ease-out';
        
        // Create avatar for this message
        const avatar = document.createElement('img');
        avatar.src = this.getPortraitForEmotion(message.emotion || 'default');
        avatar.style.width = '40px';
        avatar.style.height = '40px';
        avatar.style.borderRadius = '50%';
        avatar.style.objectFit = 'cover';
        avatar.style.border = '2px solid rgba(255, 255, 255, 0.95)';
        avatar.style.boxShadow = '0 2px 8px rgba(255, 107, 181, 0.2)';
        avatar.style.flexShrink = '0';
        messageRow.appendChild(avatar);
        
        // Create message bubble with gradient background
        const messageBubble = document.createElement('div');
        messageBubble.style.flex = '1';
        messageBubble.style.padding = '12px 16px';
        messageBubble.style.background = 'linear-gradient(135deg, rgba(255, 229, 180, 0.95) 0%, rgba(255, 182, 193, 0.95) 50%, rgba(255, 209, 220, 0.95) 100%)';
        messageBubble.style.borderRadius = '18px';
        messageBubble.style.boxShadow = '0 2px 8px rgba(255, 107, 181, 0.3)';
        messageBubble.style.fontSize = '15px';
        messageBubble.style.color = '#5A4A4A';
        messageBubble.style.lineHeight = '1.5';
        messageBubble.style.wordWrap = 'break-word';
        messageBubble.textContent = message.text;
        messageRow.appendChild(messageBubble);
        
        // Add to messages container
        this.messagesContainer.insertBefore(messageRow, this.typingIndicator);
        this.messageElements.push(messageRow);
        
        // Add fade-in animation
        if (!document.getElementById('dialogue-fade-animation')) {
            const style = document.createElement('style');
            style.id = 'dialogue-fade-animation';
            style.textContent = `
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Updates the opacity of existing messages based on their age.
     * Newest message: 1.0, second: 0.7, third: 0.4
     */
    private updateMessageOpacities(): void {
        const totalMessages = this.messageElements.length;
        this.messageElements.forEach((messageRow, index) => {
            // Calculate position from newest (1 = newest, higher = older)
            // index 0 is oldest, index (totalMessages-1) is newest
            const positionFromNewest = totalMessages - index;
            let opacity = 1.0;
            
            if (positionFromNewest === 1) {
                opacity = 1.0; // Newest message - fully opaque
            } else if (positionFromNewest === 2) {
                opacity = 0.7; // Second newest
            } else if (positionFromNewest === 3) {
                opacity = 0.4; // Third newest (oldest visible)
            }
            
            messageRow.style.opacity = opacity.toString();
        });
    }

    /**
     * Shows the typing indicator.
     */
    public showTypingIndicator(): void {
        // Update avatar in typing indicator to match current speaker
        const avatarElement = (this.typingIndicator as any).avatarElement;
        if (avatarElement && this.portraitElement.src) {
            avatarElement.style.backgroundImage = `url(${this.portraitElement.src})`;
            avatarElement.style.backgroundSize = 'cover';
            avatarElement.style.backgroundPosition = 'center';
        }
        
        this.typingIndicator.style.display = 'flex';
    }

    /**
     * Hides the typing indicator.
     */
    public hideTypingIndicator(): void {
        this.typingIndicator.style.display = 'none';
    }

    /**
     * Shows the exit button (called when dialogue is finished).
     */
    public showExitButton(): void {
        this.exitButton.style.display = 'block';
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
        this.container.style.opacity = '0';
        this.container.style.transform = 'translateX(-50%) translateY(20px)';
        this.container.style.pointerEvents = 'none';
        this.clearMessages();
        this.hideTypingIndicator();
        this.exitButton.style.display = 'none';
    }

    /**
     * Sets the callback for when the exit button is clicked.
     */
    public setOnExit(callback: () => void): void {
        this.onExitCallback = callback;
    }

    /**
     * Gets portrait image URL based on emotion string.
     * Returns a data URL for a placeholder portrait. Replace with actual image paths as needed.
     */
    private getPortraitForEmotion(emotion: string): string {
        const emotionKey = emotion.toLowerCase();
        
        // Check cache first
        if (this.portraitCache.has(emotionKey)) {
            return this.portraitCache.get(emotionKey)!;
        }
        
        // Map emotions to portrait colors/placeholders
        // You can replace these with actual image URLs later
        const portraitConfig: { [key: string]: { color: string; emoji: string } } = {
            'happy': { color: '#FFE5B4', emoji: '😊' },
            'excited': { color: '#FFB6C1', emoji: '🎉' },
            'friendly': { color: '#FFD700', emoji: '👋' },
            'surprised': { color: '#FF69B4', emoji: '😲' },
            'sad': { color: '#87CEEB', emoji: '😢' },
            'angry': { color: '#FF6347', emoji: '😠' },
            'default': { color: '#DDA0DD', emoji: '👤' }
        };
        
        const config = portraitConfig[emotionKey] || portraitConfig['default'];
        const portraitUrl = this.createPlaceholderPortrait(config.color, config.emoji);
        
        // Cache the result
        this.portraitCache.set(emotionKey, portraitUrl);
        
        return portraitUrl;
    }

    /**
     * Creates a placeholder portrait as a data URL.
     * This is a temporary solution - replace with actual portrait images.
     */
    private createPlaceholderPortrait(bgColor: string, emoji: string): string {
        // Create a canvas to generate a simple placeholder portrait
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
            // Draw background
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, 100, 100);
            
            // Draw emoji in center (as placeholder)
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

