import { DialogueScript } from './dialogue-script.js';

/**
 * Dialogue scripts for the game.
 * Each interactable can reference one of these by ID.
 */
export const gameDialogues: DialogueScript[] = [
    {
        id: 'welcome',
        name: 'ramy',
        messages: [
            {
                text: 'omg!!! you finally made it!',
                emotion: 'happy'
            },
            {
                text: 'this is ti-ramy-su land!',
                emotion: 'excited'
            },
            {
                text: 'let\'s have a look around... 👀',
                emotion: 'excited'
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
    return gameDialogues.find(d => d.id === id);
}

