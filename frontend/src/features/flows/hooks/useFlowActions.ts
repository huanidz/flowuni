/**
 * useFlowActions.ts
 *
 * Lưu ý về việc sử dụng ref trong việc access các state của nodes và edges
 * (Summarized and Generated using ChatGPT)
 * ---------------------------------------------------------------
 * Hook này gom tất cả "flow actions" (compile, run, save, reset, v.v.)
 * để các component (toolbar, buttons,...) có thể gọi mà không phải
 * biết chi tiết bên trong.
 *
 * ⚡ Quan trọng: Chúng ta dùng `useRef` để giữ `nodes` và `edges` luôn "fresh"
 * ---------------------------------------------------------------
 * - Bình thường trong React, callback được khai báo với `useCallback`
 *   sẽ "chụp" (capture) state ở thời điểm render. Nếu ta gọi callback ngay
 *   sau khi vừa `setNodes`, callback vẫn sẽ thấy state cũ (stale closure).
 *
 * - Ở đây chúng ta có nút "Reset & Run" gọi `onResetExecutionData(); onRunFlow();`
 *   trong cùng một tick. Nếu chỉ dựa vào state + render, `onRunFlow` sẽ không
 *   thấy các node đã reset, gây bug.
 *
 * - Vì vậy, chúng ta dùng `nodesRef` và `edgesRef`:
 *   + Mỗi lần `nodes` hoặc `edges` đổi → cập nhật `.current`.
 *   + Trong `setNodes`, chúng ta cũng cập nhật ref đồng bộ ngay trong updater.
 *   + Các hàm `onRunFlow`, `onSaveFlow`,... luôn đọc từ ref → luôn thấy snapshot mới nhất.
 *
 * ✔ Ưu điểm:
 *   - Predictable: không bao giờ stale, kể cả reset+run trong cùng tick.
 *   - API đơn giản: `onRunFlow()` không cần nhận tham số `nodes, edges`.
 *
 * ✘ Nhược điểm:
 *   - Callback không còn "pure function of props/state" nữa.
 *   - Có thể hơi khó hiểu cho người mới → nên giữ comment này.
 *
 * ---------------------------------------------------------------
 * 🛠 Nếu muốn refactor bỏ `ref`:
 * - Cách 1: Đổi chữ ký `onRunFlow(n, e)` để caller truyền `nodes, edges` snapshot vào.
 * - Cách 2: Gộp "reset + run" thành một hàm duy nhất, tự tính `nextNodes`
 *   rồi dùng nó cho cả `setNodes` và `runFlow`.
 * Nhưng cả hai cách trên đều làm API phức tạp hơn hoặc bớt flexible.
 *
 * 👉 Do đó, hiện tại cách dùng `ref` này là giải pháp **chuẩn và ổn định nhất**
 * cho use case "Reset & Run trong cùng tick".
 */

import React, { useCallback, useRef, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';
import useFlowStore from '@/features/flows/stores/flow_stores';
import { getFlowGraphData, logNodeDetails } from '@/features/flows/utils';
import { saveFlow, compileFlow, runFlow } from '@/features/flows/api';
import { toast } from 'sonner';
import { useSelectedNode } from '@/features/flows/hooks/useSelectedNode';
import {
    createSSEEventHandler,
    validateFlowExecution,
    handleFlowExecutionError,
} from '@/features/flows/utils/FlowActionUtils';

type SetNodesType = React.Dispatch<React.SetStateAction<Node[]>>;
type SetEdgesType = React.Dispatch<React.SetStateAction<Edge[]>>;

const handleFlowRequest = async (
    nodes: Node[],
    edges: Edge[],
    requestFn: (nodes: Node[], edges: Edge[]) => Promise<any>,
    actionLabel: string
) => {
    console.log(`=== ${actionLabel} START ===`);
    console.log('Raw nodes:', nodes);
    console.log('Raw edges:', edges);

    if (nodes.length === 0) {
        console.warn(
            `Cannot ${actionLabel.toLowerCase()}: No nodes in the graph`
        );
        return;
    }

    const flowGraphData = getFlowGraphData(nodes, edges);
    console.log('Compiling flow with payload:', flowGraphData);
    logNodeDetails(nodes);

    try {
        const response = await requestFn(nodes, edges);
        console.log(`${actionLabel} successful:`, response);
    } catch (error) {
        console.error(`Error during ${actionLabel.toLowerCase()}:`, error);
    }

    console.log(`=== ${actionLabel} END ===`);
};

export const useFlowActions = (
    nodes: Node[],
    edges: Edge[],
    setNodes: SetNodesType,
    setEdges: SetEdgesType,
    nodeUpdateHandlers: any
) => {
    const { current_flow } = useFlowStore();
    const { selectedNode } = useSelectedNode(setNodes);

    const handleSSEEvent = createSSEEventHandler(nodeUpdateHandlers);

    // ---- refs always read the freshest snapshot ----
    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);

    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);
    useEffect(() => {
        edgesRef.current = edges;
    }, [edges]);
    // ------------------------------------------------

    const onCompileFlow = useCallback(() => {
        return handleFlowRequest(
            nodesRef.current,
            edgesRef.current,
            compileFlow,
            'COMPILATION'
        );
    }, []);

    const onRunFlow = useCallback(async () => {
        const n = nodesRef.current;
        const e = edgesRef.current;

        const validation = validateFlowExecution(current_flow, null, true);
        if (!validation.isValid) return;

        console.log('[onRunFlow] Running flow...');

        try {
            const response = await runFlow(n, e);
            const { task_id } = response;

            console.log('[onRunFlow] Flow run response:', response);
            console.log(
                '[onRunFlow] Watching execution with task_id:',
                task_id
            );

            handleSSEEvent(task_id);
        } catch (err) {
            handleFlowExecutionError(err, 'onRunFlow');
        }
    }, [current_flow, handleSSEEvent]);

    const onRunFlowFromSelectedNode = useCallback(async () => {
        const n = nodesRef.current;
        const e = edgesRef.current;

        const validation = validateFlowExecution(
            current_flow,
            selectedNode,
            true
        );
        if (!validation.isValid) return;

        console.log(
            '[onRunFlowFromSelectedNode] Running from node...',
            selectedNode?.id
        );

        try {
            const response = await runFlow(
                n,
                e,
                selectedNode?.id || '',
                'downstream'
            );
            const { task_id } = response;
            console.log(
                '[onRunFlowFromSelectedNode] Flow run response:',
                response
            );
            handleSSEEvent(task_id);
        } catch (err) {
            handleFlowExecutionError(err, 'onRunFlowFromSelectedNode');
        }
    }, [current_flow, selectedNode, handleSSEEvent]);

    const onRunSelectedOnly = useCallback(async () => {
        const n = nodesRef.current;
        const e = edgesRef.current;

        const validation = validateFlowExecution(current_flow, selectedNode);
        if (!validation.isValid) return;

        console.log(
            '[onRunSelectedOnly] Running selected only...',
            selectedNode?.id
        );

        try {
            const response = await runFlow(
                n,
                e,
                selectedNode?.id || '',
                'node_only'
            );
            const { task_id } = response;
            console.log('[onRunSelectedOnly] Flow run response:', response);
            handleSSEEvent(task_id);
        } catch (err) {
            handleFlowExecutionError(err, 'onRunSelectedOnly');
        }
    }, [current_flow, selectedNode, handleSSEEvent]);

    const onSaveFlow = useCallback(async () => {
        if (!current_flow) {
            console.warn('Cannot save flow: No current flow');
            return;
        }

        await saveFlow({
            flow_id: current_flow.flow_id,
            name: current_flow.name,
            description: current_flow.description,
            is_active: current_flow.is_active,
            flow_definition: getFlowGraphData(
                nodesRef.current,
                edgesRef.current
            ),
        });

        toast.success('Flow saved successfully.', {
            description: 'Flow has been saved successfully.',
        });
    }, [current_flow]);

    const onClearFlow = useCallback(() => {
        // Update ref synchronously so subsequent actions see cleared state immediately
        nodesRef.current = [];
        edgesRef.current = [];
        setNodes([]);
        setEdges([]);
    }, [setNodes, setEdges]);

    // --------- UPDATED: single set + sync ref update ----------
    const onResetAllData = useCallback(() => {
        setNodes(prev => {
            const next = prev.map(node => {
                const nextInputValues = Object.fromEntries(
                    Object.keys(node.data?.input_values || {}).map(k => [k, ''])
                );
                const nextOutputValues = Object.fromEntries(
                    Object.keys(node.data?.output_values || {}).map(k => [
                        k,
                        '',
                    ])
                );
                return {
                    ...node,
                    data: {
                        ...node.data,
                        input_values: nextInputValues,
                        output_values: nextOutputValues,
                        execution_result: null,
                        execution_status: 'draft',
                    },
                };
            });
            // critical: set ref now, in the same tick
            nodesRef.current = next;
            return next;
        });
        // edges unchanged here; if you ever change them, assign edgesRef.current similarly
    }, [setNodes]);

    const onResetExecutionData = useCallback(() => {
        setNodes(prev => {
            const next = prev.map(node => {
                const nextOutputValues = Object.fromEntries(
                    Object.keys(node.data?.output_values || {}).map(k => [
                        k,
                        '',
                    ])
                );
                return {
                    ...node,
                    data: {
                        ...node.data,
                        output_values: nextOutputValues,
                        execution_result: null,
                        execution_status: 'draft',
                    },
                };
            });
            // critical: set ref now, in the same tick
            nodesRef.current = next;
            return next;
        });
    }, [setNodes]);
    // ----------------------------------------------------------

    const onPlaygroundFlow = useCallback(() => {
        console.log('Playground action triggered');
    }, []);

    return {
        onCompileFlow,
        onRunFlow,
        onRunFlowFromSelectedNode,
        onRunSelectedOnly,
        onClearFlow,
        onResetAllData,
        onResetExecutionData,
        onSaveFlow,
        onPlaygroundFlow,
    };
};
