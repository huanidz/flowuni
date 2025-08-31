# Node Architecture Documentation

## Overview

This document describes the refactored node architecture for the Flow Builder application. The new architecture eliminates redundancy and improves maintainability by consolidating node state management and simplifying the data flow.

## Architecture Changes

### Before (Old Architecture)

The old architecture had several issues:

1. **Redundant Handler Layers**: 
   - `useNodeHandlers.ts` created wrapper functions that simply called passed-in update functions
   - `useNodeAllTypesConstructor.tsx` defined duplicate update logic
   - This created unnecessary abstraction layers

2. **Complex Data Flow**:
   ```
   User Interaction → Node Component → useNodeHandlers → useNodeAllTypesConstructor → setNodes
   ```

3. **Mixed Responsibilities**:
   - `NodeFactory.tsx` handled both component creation and state management
   - State update logic was scattered across multiple files

### After (New Architecture)

The new architecture provides:

1. **Unified State Management**: Single `useNodeUpdate` hook for all node updates
2. **Clear Separation of Concerns**: Each component has a single responsibility
3. **Simplified Data Flow**: Direct path from user interaction to state update

```
User Interaction → Node Component → useNodeUpdate → setNodes
```

## New Components

### 1. `useNodeUpdate` Hook

**Location**: `frontend/src/features/flows/hooks/useNodeUpdate.ts`

**Purpose**: Unified hook for handling all node state update operations.

**Key Features**:
- Consolidates all update logic in one place
- Provides four main update functions:
  - `updateNodeInputData`: Updates specific input values
  - `updateNodeModeData`: Updates node mode
  - `updateNodeParameterData`: Updates parameter values
  - `updateNodeData`: Updates complete node data objects

**Usage**:
```typescript
const { updateNodeInputData, updateNodeModeData, updateNodeParameterData, updateNodeData } = useNodeUpdate(setNodes);

// Update an input value
updateNodeInputData(nodeId, 'inputName', newValue);

// Update node mode
updateNodeModeData(nodeId, 'ToolMode');

// Update a parameter
updateNodeParameterData(nodeId, 'paramName', paramValue);
```

### 2. `useNodeTypes` Hook

**Location**: `frontend/src/features/flows/hooks/useNodeTypes.ts`

**Purpose**: Manages node type registration and component creation.

**Key Features**:
- Separates node type registration from state management
- Accepts update handlers as parameters to avoid infinite loops
- Provides `nodeTypes` and `nodeTypesLoaded` for React Flow integration

**Usage**:
```typescript
const updateHandlers = useNodeUpdate(setNodes);
const { nodeTypes, nodeTypesLoaded } = useNodeTypes(
  setNodes,
  updateHandlers.updateNodeData,
  updateHandlers.updateNodeModeData,
  updateHandlers.updateNodeParameterData
);

// Use in ReactFlow
<ReactFlow nodeTypes={nodeTypes} />
```

### 3. Refactored `NodeFactory`

**Location**: `frontend/src/features/flows/utils/NodeFactory.tsx`

**Purpose**: Pure component factory without state management responsibilities.

**Key Changes**:
- Removed dependency on `useNodeHandlers`
- Accepts update handlers directly as parameters
- Focuses solely on creating React components

**Usage**:
```typescript
const CustomNodeComponent = NodeFactory.createNodeComponent(
  nodeSpec,
  updateNodeData,
  updateNodeModeData,
  updateNodeParameterData
);
```

## Data Flow

### New Simplified Flow

1. **User Interaction**: User clicks on a node input/parameter/mode control
2. **Component Handler**: Node component calls the appropriate handler function
3. **Unified Update**: `useNodeUpdate` hook processes the update
4. **State Update**: React state is updated via `setNodes`
5. **Re-render**: Components re-render with updated data

### Important: Preventing Infinite Loops

The architecture is designed to prevent infinite loops by:
- Separating hook dependencies to avoid circular references
- Memoizing return values to prevent unnecessary re-renders
- Passing update handlers as parameters rather than creating them internally

### Example: Input Value Update

```typescript
// 1. User changes input value in component
<InputSection onInputValueChange={(value) => handleInputChange(inputName, value)} />

// 2. Component calls handler (from NodeFactory)
const handleInputChange = (inputName: string, value: any) => {
  if (updateNodeData) {
    updateNodeData(nodeId, {
      input_values: {
        ...input_values,
        [inputName]: value
      },
    });
  }
};

// 3. useNodeUpdate processes the update
const updateNodeData = useCallback((nodeId: string, newData: any) => {
  setNodes(nodes => 
    nodes.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...newData } }
        : node
    )
  );
}, [setNodes]);
```

## Migration Guide

### From Old to New Architecture

1. **Replace Hook Usage**:
   ```typescript
   // Old
   const { nodeTypes, nodeTypesLoaded } = useAllNodeTypesConstructor(setNodes);
   
   // New
   const { nodeTypes, nodeTypesLoaded } = useNodeTypes(setNodes);
   ```

2. **Remove Redundant Handlers**:
   - No need to create separate handler functions in components
   - Use the unified handlers from `useNodeUpdate`

3. **Update NodeFactory Usage**:
   - The NodeFactory now receives handlers directly
   - No internal handler creation logic needed

### Files Changed

1. **Created**:
   - `useNodeUpdate.ts`: Unified state management
   - `useNodeTypes.ts`: Simplified node type registration
   - `NodeArchitecture.md`: This documentation

2. **Modified**:
   - `NodeFactory.tsx`: Removed `useNodeHandlers` dependency
   - `FlowBuilder.tsx`: Updated to use new hook

3. **Deprecated**:
   - `useNodeHandlers.ts`: Can be removed after migration
   - `useNodeAllTypesConstructor.tsx`: Replaced by `useNodeTypes`

## Benefits

### 1. **Reduced Complexity**
- Eliminated redundant abstraction layers
- Simplified data flow from 4 steps to 3 steps
- Clear separation of concerns

### 2. **Better Maintainability**
- Single source of truth for node updates
- Easier to modify update logic
- Reduced code duplication

### 3. **Improved Performance**
- Fewer re-renders due to simplified hooks
- Memoized return values prevent unnecessary updates
- Direct function calls reduce overhead

### 4. **Easier Testing**
- Each hook has a single responsibility
- Update logic is centralized and testable
- Components are simpler and easier to mock

### 5. **Better Type Safety**
- Unified type definitions for update operations
- Clear interfaces for all hook functions
- Reduced type-related bugs

## Future Considerations

1. **Performance Optimization**: Consider using React.memo for node components
2. **State Management**: Could be extended to use Redux or Zustand for complex flows
3. **Caching**: Add caching for node type definitions to reduce re-creation
4. **Error Handling**: Add comprehensive error handling for update operations
5. **Logging**: Add structured logging for debugging node updates

## Testing

### Unit Tests
- Test each hook function independently
- Verify state updates are applied correctly
- Test error handling and edge cases

### Integration Tests
- Test the complete data flow from user interaction to state update
- Verify React Flow integration works correctly
- Test multiple node types simultaneously

### E2E Tests
- Test user interactions with node components
- Verify data persistence across state updates
- Test performance with large numbers of nodes