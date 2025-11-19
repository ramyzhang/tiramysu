import { DialogueMessage } from '../dialogue/dialogue-script.js';

/**
 * Reusable dialogue box UI component.
 * Creates and manages a cute dialogue box that displays messages.
 */
export class DialogueBox {
    private container: HTMLDivElement;
    private contentWrapper: HTMLDivElement;
    private portraitElement: HTMLImageElement;
    private nameElement: HTMLDivElement;
    private messageElement: HTMLDivElement;
    private continueButton: HTMLButtonElement;
    private isVisible: boolean = false;
    private onContinueCallback: (() => void) | null = null;
    private portraitCache: Map<string, string> = new Map();

    constructor() {
        // Create main container
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.bottom = '40px';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        this.container.style.width = '600px';
        this.container.style.maxWidth = 'calc(100vw - 40px)'; // 20px margin on each side (20px left + 20px right)
        this.container.style.boxSizing = 'border-box'; // Include padding in width calculation
        this.container.style.background = 'linear-gradient(135deg, #FFE5B4 0%, #FFB6C1 50%, #FFD1DC 100%)';
        this.container.style.padding = '28px 32px';
        this.container.style.borderRadius = '28px';
        this.container.style.boxShadow = '0 12px 40px rgba(255, 107, 181, 0.4), 0 0 0 4px rgba(255, 255, 255, 0.6), inset 0 2px 8px rgba(255, 255, 255, 0.3)';
        this.container.style.border = '2px solid rgba(255, 255, 255, 0.8)';
        this.container.style.fontFamily = "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
        this.container.style.zIndex = '100000';
        this.container.style.opacity = '0';
        this.container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        this.container.style.transform = 'translateX(-50%) translateY(20px)';
        this.container.style.pointerEvents = 'none';
        this.container.style.userSelect = 'none';
        this.container.style.display = 'flex';
        this.container.style.gap = '20px';
        this.container.style.alignItems = 'flex-start';

        // Create portrait element
        this.portraitElement = document.createElement('img');
        this.portraitElement.style.width = '110px';
        this.portraitElement.style.height = '110px';
        this.portraitElement.style.borderRadius = '24px';
        this.portraitElement.style.objectFit = 'cover';
        this.portraitElement.style.border = '4px solid rgba(255, 255, 255, 0.95)';
        this.portraitElement.style.boxShadow = '0 6px 20px rgba(255, 107, 181, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.5)';
        this.portraitElement.style.flexShrink = '0';
        this.portraitElement.style.background = 'rgba(255, 255, 255, 0.4)';
        this.portraitElement.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        this.container.appendChild(this.portraitElement);

        // Create content wrapper for name and message
        this.contentWrapper = document.createElement('div');
        this.contentWrapper.style.flex = '1';
        this.contentWrapper.style.display = 'flex';
        this.contentWrapper.style.flexDirection = 'column';
        this.container.appendChild(this.contentWrapper);

        // Create name element
        this.nameElement = document.createElement('div');
        this.nameElement.style.fontSize = '22px';
        this.nameElement.style.fontWeight = '700';
        this.nameElement.style.color = '#8B4513';
        this.nameElement.style.marginBottom = '14px';
        this.nameElement.style.textShadow = '0 2px 4px rgba(255, 255, 255, 0.6)';
        this.nameElement.style.letterSpacing = '0.5px';
        this.contentWrapper.appendChild(this.nameElement);

        // Create message element
        this.messageElement = document.createElement('div');
        this.messageElement.style.fontSize = '17px';
        this.messageElement.style.color = '#5A4A4A';
        this.messageElement.style.lineHeight = '1.7';
        this.messageElement.style.marginBottom = '18px';
        this.messageElement.style.minHeight = '60px';
        this.messageElement.style.textShadow = '0 1px 2px rgba(255, 255, 255, 0.4)';
        this.contentWrapper.appendChild(this.messageElement);

        // Create continue button
        this.continueButton = document.createElement('button');
        this.continueButton.textContent = 'Continue →';
        this.continueButton.style.width = '100%';
        this.continueButton.style.padding = '14px 24px';
        this.continueButton.style.background = 'linear-gradient(135deg, #FFFFFF 0%, #FFF0F5 100%)';
        this.continueButton.style.border = '3px solid #FFB6C1';
        this.continueButton.style.borderRadius = '16px';
        this.continueButton.style.fontSize = '17px';
        this.continueButton.style.fontWeight = '700';
        this.continueButton.style.color = '#8B4513';
        this.continueButton.style.cursor = 'pointer';
        this.continueButton.style.fontFamily = 'inherit';
        this.continueButton.style.boxShadow = '0 4px 12px rgba(255, 182, 193, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.8)';
        this.continueButton.style.position = 'relative';
        this.continueButton.style.overflow = 'hidden';
        
        // Add bouncy animation using CSS keyframes
        this.setupBouncyAnimation();
        
        // Button hover effects
        this.continueButton.addEventListener('mouseenter', () => {
            this.continueButton.style.background = 'linear-gradient(135deg, #FFFFFF 0%, #FFE4E1 100%)';
            this.continueButton.style.borderColor = '#FF91A4';
            this.continueButton.style.boxShadow = '0 6px 20px rgba(255, 182, 193, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.9)';
            this.continueButton.style.animation = 'dialogue-bounce-hover 1.5s ease-in-out infinite, dialogue-glow 2s ease-in-out infinite';
        });
        this.continueButton.addEventListener('mouseleave', () => {
            this.continueButton.style.background = 'linear-gradient(135deg, #FFFFFF 0%, #FFF0F5 100%)';
            this.continueButton.style.borderColor = '#FFB6C1';
            this.continueButton.style.boxShadow = '0 4px 12px rgba(255, 182, 193, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.8)';
            this.continueButton.style.animation = 'dialogue-bounce 2s ease-in-out infinite, dialogue-glow 2s ease-in-out infinite';
        });
        
        this.continueButton.addEventListener('click', () => {
            // Temporarily pause animation and add click bounce
            const originalAnimation = this.continueButton.style.animation;
            this.continueButton.style.animation = 'dialogue-click-bounce 0.4s ease-out';
            setTimeout(() => {
                this.continueButton.style.animation = originalAnimation;
            }, 400);
            
            if (this.onContinueCallback) {
                this.onContinueCallback();
            }
        });

        this.contentWrapper.appendChild(this.continueButton);
        document.body.appendChild(this.container);
    }

    /**
     * Sets up the bouncy animation for the continue button using CSS keyframes.
     */
    private setupBouncyAnimation(): void {
        // Check if keyframes already exist
        if (document.getElementById('dialogue-bounce-keyframes')) {
            return;
        }

        // Create style element with keyframes
        const style = document.createElement('style');
        style.id = 'dialogue-bounce-keyframes';
        style.textContent = `
            @keyframes dialogue-bounce {
                0%, 100% {
                    transform: translateY(0) scale(1);
                }
                50% {
                    transform: translateY(-5px) scale(1.03);
                }
            }
            
            @keyframes dialogue-bounce-hover {
                0%, 100% {
                    transform: translateY(-2px) scale(1.05);
                }
                50% {
                    transform: translateY(-7px) scale(1.08);
                }
            }
            
            @keyframes dialogue-click-bounce {
                0% {
                    transform: translateY(0) scale(1);
                }
                30% {
                    transform: translateY(0) scale(0.92);
                }
                60% {
                    transform: translateY(-8px) scale(1.1);
                }
                100% {
                    transform: translateY(0) scale(1);
                }
            }
            
            @keyframes dialogue-glow {
                0%, 100% {
                    box-shadow: 0 4px 12px rgba(255, 182, 193, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.8);
                }
                50% {
                    box-shadow: 0 6px 18px rgba(255, 182, 193, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.9);
                }
            }
        `;
        document.head.appendChild(style);

        // Apply the bouncy animation
        this.continueButton.style.animation = 'dialogue-bounce 2s ease-in-out infinite, dialogue-glow 2s ease-in-out infinite';
        this.continueButton.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    }

    /**
     * Shows the dialogue box with a message.
     */
    public show(message: DialogueMessage, speakerName: string): void {
        this.nameElement.textContent = message.speaker || speakerName;
        this.messageElement.textContent = message.text;
        
        // Set portrait based on emotion
        const portraitUrl = this.getPortraitForEmotion(message.emotion || 'default');
        this.portraitElement.src = portraitUrl;
        
        // Add a subtle bounce to the portrait when showing
        this.portraitElement.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.portraitElement.style.transform = 'scale(1)';
        }, 50);

        this.isVisible = true;
        this.container.style.pointerEvents = 'auto';
        this.container.style.opacity = '1';
        this.container.style.transform = 'translateX(-50%) translateY(0)';
    }

    /**
     * Hides the dialogue box.
     */
    public hide(): void {
        this.isVisible = false;
        this.container.style.opacity = '0';
        this.container.style.transform = 'translateX(-50%) translateY(20px)';
        this.container.style.pointerEvents = 'none';
    }

    /**
     * Sets the callback for when the continue button is clicked.
     */
    public setOnContinue(callback: () => void): void {
        this.onContinueCallback = callback;
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

