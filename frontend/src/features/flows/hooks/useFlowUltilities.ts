// frontend/src/features/flows/hooks/useFlowUltilities.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import useFlowStore from '@/features/flows/stores/flow_stores';
import { getFlowGraphData } from '@/features/flows/utils';
import { saveFlow } from '@/features/flows/api';

/**
 * Simple and fast DJB2 hash for strings.
 * Not cryptographically secure but suitable for change-detection.
 * @param str string to hash
 * @returns number hash
 */
const djb2Hash = (str: string): number => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    // Convert to positive 32-bit integer
    return hash >>> 0;
};

type UseFlowUtilitiesOptions = {
    /**
     * Auto save interval in milliseconds. Defaults to 10000 (10s).
     */
    intervalMs?: number;
    /**
     * Enable or disable autsave; default true.
     */
    enabled?: boolean;
};

/**
 * Hook providing flow-related utilities such as autosave.
 *
 * Behavior:
 * - Computes a fast hash of JSON.stringify(getFlowGraphData(nodes, edges))
 * - Polls every `intervalMs` (10s default). If the hash changed since last saved
 *   it triggers an async background save using saveFlow API.
 * - Ensures only one save runs at a time. Non-blocking to UI.
 *
 * @param nodes current nodes array
 * @param edges current edges array
 * @param opts optional settings
 * @returns object with currentHash and manual forceSave function
 */
export const useFlowUltilities = (
    nodes: Node[],
    edges: Edge[],
    opts: UseFlowUtilitiesOptions = {}
) => {
    const { intervalMs = 10000, enabled = true } = opts;

    const { current_flow } = useFlowStore();

    // Keep the last computed graph hash (local) and the last-saved hash
    const lastComputedHashRef = useRef<number | null>(null);
    const lastSavedHashRef = useRef<number | null>(null);

    // Expose current hash for debugging/UI
    const [currentHash, setCurrentHash] = useState<number | null>(null);

    // Track whether a save is in progress to avoid concurrent saves
    const savingRef = useRef(false);

    // Skip first run of the "nodes/edges change" effect
    const mountedRef = useRef(false);

    // Compute hash from nodes + edges
    const computeHash = useCallback((ns: Node[], es: Edge[]) => {
        try {
            const payload = getFlowGraphData(ns, es);
            // Stable stringify: we rely on the shape produced by getFlowGraphData.
            const str = JSON.stringify(payload);
            return djb2Hash(str);
        } catch (err) {
            console.error('Error computing flow hash:', err);
            return null;
        }
    }, []);

    // Async save function used by autosave and manual trigger
    const doSave = useCallback(
        async (ns: Node[], es: Edge[]) => {
            if (!current_flow) {
                console.warn(
                    'useFlowUltilities: no current_flow, skipping save'
                );
                return false;
            }
            if (savingRef.current) {
                // Already saving; skip this invocation to avoid overlap
                return false;
            }

            savingRef.current = true;
            try {
                const payload = getFlowGraphData(ns, es);
                await saveFlow({
                    flow_id: current_flow.flow_id,
                    name: current_flow.name,
                    description: current_flow.description,
                    is_active: current_flow.is_active,
                    flow_definition: payload,
                });

                // update last-saved hash to the latest computed
                const h = computeHash(ns, es);
                lastSavedHashRef.current = h;
                setCurrentHash(h);

                // Update the saved status in the store
                const { setSaved } = useFlowStore.getState();
                setSaved(true);

                return true;
            } catch (err) {
                console.error('Auto-save failed:', err);
                return false;
            } finally {
                savingRef.current = false;
            }
        },
        [current_flow, computeHash]
    );

    // Exposed manual force save
    const forceSave = useCallback(async () => {
        return await doSave(nodes, edges);
    }, [doSave, nodes, edges]);

    useEffect(() => {
        // Don't do anything if there's no data to process yet.
        if (nodes.length === 0 && edges.length === 0) {
            return;
        }

        const h = computeHash(nodes, edges);
        lastComputedHashRef.current = h;
        setCurrentHash(h); // **Initialization**: If we haven't set a "saved" hash yet,
        // this must be the initial data load. Set it and consider it saved.

        if (lastSavedHashRef.current === null) {
            lastSavedHashRef.current = h;
            return; // Exit without marking as unsaved.
        } // **Change Detection**: If a saved hash exists, compare it to the
        // current hash to detect actual changes.

        if (h !== lastSavedHashRef.current) {
            const { setSaved } = useFlowStore.getState();
            setSaved(false);
        }
    }, [nodes, edges, computeHash]);

    // Effect: autosave interval
    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;

        const tick = async () => {
            if (cancelled) return;
            try {
                const computed = computeHash(nodes, edges);
                if (computed === null) return;

                if (computed !== lastSavedHashRef.current) {
                    if (!savingRef.current) {
                        void doSave(nodes, edges);
                    }
                }
            } catch (err) {
                console.error('Autosave tick error:', err);
            }
        };

        const id = setInterval(tick, intervalMs);

        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [enabled, intervalMs, nodes, edges, computeHash, doSave]);

    return {
        currentHash,
        forceSave,
    };
};

export default useFlowUltilities;
