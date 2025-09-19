// frontend/src/features/flows/hooks/useFlowUltilities.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import useFlowStore from '@/features/flows/stores/flow_stores';
import { getFlowGraphData } from '@/features/flows/utils';
import { saveFlow } from '@/features/flows/api';

const djb2Hash = (str: string): number => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0;
};

type UseFlowUtilitiesOptions = {
    intervalMs?: number;
    enabled?: boolean;
};

export const useFlowUltilities = (
    nodes: Node[],
    edges: Edge[],
    opts: UseFlowUtilitiesOptions = {}
) => {
    const { intervalMs = 10000, enabled = true } = opts;

    const { current_flow } = useFlowStore();

    const lastComputedHashRef = useRef<number | null>(null);
    const lastSavedHashRef = useRef<number | null>(null);

    const [currentHash, setCurrentHash] = useState<number | null>(null);
    const savingRef = useRef(false);

    const computeHash = useCallback((ns: Node[], es: Edge[]) => {
        try {
            const payload = getFlowGraphData(ns, es);
            const str = JSON.stringify(payload);
            return djb2Hash(str);
        } catch (err) {
            console.error('Error computing flow hash:', err);
            return null;
        }
    }, []);

    const doSave = useCallback(
        async (ns: Node[], es: Edge[]) => {
            if (!current_flow) {
                console.warn(
                    'useFlowUltilities: no current_flow, skipping save'
                );
                return false;
            }
            if (savingRef.current) {
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

                const h = computeHash(ns, es);
                lastSavedHashRef.current = h;
                setCurrentHash(h);

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

    // New method: trySave
    const trySave = useCallback(async () => {
        const h = computeHash(nodes, edges);
        if (h === null) return false;

        if (h !== lastSavedHashRef.current) {
            return await doSave(nodes, edges);
        }
        return false;
    }, [computeHash, doSave, nodes, edges]);

    const forceSave = useCallback(async () => {
        return await doSave(nodes, edges);
    }, [doSave, nodes, edges]);

    useEffect(() => {
        if (nodes.length === 0 && edges.length === 0) {
            return;
        }

        const h = computeHash(nodes, edges);
        lastComputedHashRef.current = h;
        setCurrentHash(h);

        if (lastSavedHashRef.current === null) {
            lastSavedHashRef.current = h;
            return;
        }

        if (h !== lastSavedHashRef.current) {
            const { setSaved } = useFlowStore.getState();
            setSaved(false);
        }
    }, [nodes, edges, computeHash]);

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;

        const tick = async () => {
            if (cancelled) return;
            try {
                await trySave();
            } catch (err) {
                console.error('Autosave tick error:', err);
            }
        };

        const id = setInterval(tick, intervalMs);

        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [enabled, intervalMs, trySave]);

    return {
        currentHash,
        forceSave,
        trySave, // expose trySave
    };
};

export default useFlowUltilities;
