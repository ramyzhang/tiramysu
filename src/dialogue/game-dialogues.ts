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
        id: 'lil-tao',
        name: 'LilTao',
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
    }
];

/**
 * Gets a dialogue script by ID.
 */
export function getDialogueById(id: string): DialogueScript | undefined {
    return gameDialogues.find(d => d.id === id);
}

