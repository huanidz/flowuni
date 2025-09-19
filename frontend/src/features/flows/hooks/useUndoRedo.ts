import { useState, useEffect, useCallback, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface HistoryState {
    nodes: Node[];
    edges: Edge[];
}

interface UseUndoRedoProps {
    nodes: Node[];
    edges: Edge[];
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

export const useUndoRedo = ({
    nodes,
    edges,
    setNodes,
    setEdges,
}: UseUndoRedoProps) => {
    const [history, setHistory] = useState<HistoryState[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const isUndoRedoRef = useRef(false);
    const maxHistory = 50; // Limit history to prevent memory issues

    const recordHistory = useCallback(() => {
        if (isUndoRedoRef.current) return;

        const newState: HistoryState = {
            nodes: JSON.parse(JSON.stringify(nodes)),
            edges: JSON.parse(JSON.stringify(edges)),
        };

        setHistory(prev => {
            const newHistory = prev.slice(0, currentIndex + 1);
            newHistory.push(newState);
            if (newHistory.length > maxHistory) {
                newHistory.shift();
                setCurrentIndex(maxHistory - 1);
                return newHistory;
            }
            setCurrentIndex(newHistory.length - 1);
            return newHistory;
        });
    }, [nodes, edges, currentIndex]);

    useEffect(() => {
        recordHistory();
    }, [recordHistory]);

    const undo = useCallback(() => {
        if (currentIndex > 0) {
            isUndoRedoRef.current = true;
            const prevState = history[currentIndex - 1];
            setNodes(prevState.nodes);
            setEdges(prevState.edges);
            setCurrentIndex(currentIndex - 1);
            setTimeout(() => {
                isUndoRedoRef.current = false;
            }, 0);
        }
    }, [history, currentIndex, setNodes, setEdges]);

    const redo = useCallback(() => {
        if (currentIndex < history.length - 1) {
            isUndoRedoRef.current = true;
            const nextState = history[currentIndex + 1];
            setNodes(nextState.nodes);
            setEdges(nextState.edges);
            setCurrentIndex(currentIndex + 1);
            setTimeout(() => {
                isUndoRedoRef.current = false;
            }, 0);
        }
    }, [history, currentIndex, setNodes, setEdges]);

    return { undo, redo };
};
