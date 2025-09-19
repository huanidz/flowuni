import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
    combo: string; // e.g., 'Ctrl+S', 'Ctrl+Z'
    handler: () => void;
    preventDefault?: boolean;
}

const parseCombo = (combo: string): { key: string; modifiers: Set<string> } => {
    const parts = combo.split('+');
    const key = parts.pop()!.trim().toLowerCase();
    const modifiers = new Set(parts.map(p => p.trim().toLowerCase()));
    return { key, modifiers };
};

const matchesCombo = (event: KeyboardEvent, combo: string): boolean => {
    const { key, modifiers } = parseCombo(combo);
    const eventKey = event.key.toLowerCase();
    const eventModifiers = new Set(
        [
            event.ctrlKey && 'ctrl',
            event.altKey && 'alt',
            event.shiftKey && 'shift',
            event.metaKey && 'meta',
        ].filter(Boolean) as string[]
    );

    return eventKey === key && [...modifiers].every(m => eventModifiers.has(m));
};

export const useKeyboardControl = (shortcuts: KeyboardShortcut[]) => {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                if (matchesCombo(event, shortcut.combo)) {
                    if (shortcut.preventDefault !== false) {
                        event.preventDefault();
                    }
                    shortcut.handler();
                    // Optional: event.stopPropagation() if needed to prevent bubbling
                    break;
                }
            }
        },
        [shortcuts]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
};
