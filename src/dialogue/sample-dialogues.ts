import { DialogueScript } from './dialogue-script.js';

/**
 * Sample dialogue scripts for the game.
 * Each interactable can reference one of these by ID.
 */
export const sampleDialogues: DialogueScript[] = [
    {
        id: 'welcome',
        name: 'Ramy',
        messages: [
            {
                text: 'Welcome to Tiramysu Land! 🍰',
                emotion: 'happy'
            },
            {
                text: 'I\'m your friendly dessert guide. Click around to explore!',
                emotion: 'excited'
            },
            {
                text: 'Have fun and enjoy your stay! ✨'
            }
        ]
    },
    {
        id: 'mystery-box',
        name: 'Mysterious Box',
        messages: [
            {
                text: '*The box shimmers with a soft pink glow*',
                speaker: 'Narrator'
            },
            {
                text: 'Inside, you find...',
                speaker: 'Narrator'
            },
            {
                text: 'A tiny cake! 🎂',
                speaker: 'Narrator',
                emotion: 'surprised'
            },
            {
                text: 'It looks delicious! Maybe you should save it for later.'
            }
        ]
    },
    {
        id: 'friendly-npc',
        name: 'Berry',
        messages: [
            {
                text: 'Oh, hello there! 👋',
                emotion: 'friendly'
            },
            {
                text: 'I\'m Berry! I love exploring this dessert world.',
                emotion: 'happy'
            },
            {
                text: 'Have you tried the tiramisu yet? It\'s absolutely divine!',
                emotion: 'excited'
            },
            {
                text: 'Well, I should get going. See you around! 🌸'
            }
        ]
    }
];

/**
 * Gets a dialogue script by ID.
 */
export function getDialogueById(id: string): DialogueScript | undefined {
    return sampleDialogues.find(d => d.id === id);
}

