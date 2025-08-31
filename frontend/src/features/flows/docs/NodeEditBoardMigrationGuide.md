# NodeEditBoard Migration Guide

This guide explains how to migrate from the old `NodeEditBoard` component to the new `NodeConfigSidebar` for node configuration in the ReactFlow application.

## Overview

The `NodeEditBoard` component has been deprecated in favor of the new `NodeConfigSidebar` which provides a better user experience and more flexible node configuration options.

## Key Differences

### NodeEditBoard (Old)
- Embedded within each node
- Limited space for complex configurations
- Fixed width that could cause overflow
- Tabbed interface for different sections
- Could only edit one node at a time

### NodeConfigSidebar (New)
- Fixed position on the right side of the canvas
- Ample space for complex configurations
- Collapsible/expandable design
- Full-width components for better usability
- Real-time preview of changes
- Keyboard shortcuts support

## Migration Steps

### 1. Remove NodeEditBoard from Node Components

**Before:**
```tsx
<NodeEditBoard
  spec_inputs={nodeSpec.inputs}
  input_values={input_values}
  parameter_values={parameter_values}
  tool_configs={tool_configs}
  mode={mode}
  onInputValueChange={handleInputValueChange}
  onParameterChange={handleParameterChange}
  onModeChange={handleModeChange}
  onToolConfigChange={handleToolConfigChange}
/>
```

**After:**
Remove the `NodeEditBoard` component entirely from node components. The sidebar will handle all configuration.

### 2. Update Node Selection Logic

**Before:**
```tsx
const [showEditBoard, setShowEditBoard] = React.useState(false);

const handleToggleEditBoard = () => {
  setShowEditBoard(!showEditBoard);
};
```

**After:**
```tsx
// No longer needed - selection is handled by the sidebar
```

### 3. Update Node Factory

**Before:**
```tsx
class NodeFactoryClass {
  createNodeComponent(...) {
    // ... existing code ...
    
    return (
      <div style={nodeStyles.container}>
        {/* ... other components ... */}
        {showEditBoard && (
          <NodeEditBoard
            // ... props ...
          />
        )}
      </div>
    );
  }
}
```

**After:**
```tsx
class NodeFactoryClass {
  createNodeComponent(...) {
    // ... existing code ...
    
    return (
      <div style={nodeStyles.container} onClick={() => onNodeSelect?.(id)}>
        {/* Simplified node without edit board */}
        <NodeHeader
          label={label}
          description={description}
          mode={mode}
          onModeChange={handleModeChange}
          canBeTool={can_be_tool}
          // Remove onToggleEditBoard prop
        />
        
        <InputsSection
          spec_inputs={nodeSpec.inputs}
          input_values={input_values}
          nodeId={id}
          onInputValueChange={handleInputValueChange}
          node_mode={mode}
        />
        
        <OutputsSection spec_outputs={nodeSpec.outputs} node_mode={mode} />
        <NodeExecutionResult
          result={data.execution_result}
          status={data.execution_status}
        />
      </div>
    );
  }
}
```

### 4. Update FlowBuilder Integration

**Before:**
```tsx
// No sidebar - configuration was embedded in nodes
```

**After:**
```tsx
// Add sidebar to FlowBuilder
<div className="flex h-screen">
  <div className="flex-1">
    <ReactFlow
      // ... existing props ...
    />
  </div>
  
  <div className="w-96 border-l border-gray-200 bg-white">
    <NodeConfigSidebar
      selectedNodeData={selectedNodeData}
      onInputValueChange={handleInputValueChange}
      onParameterChange={handleParameterChange}
      onModeChange={handleModeChange}
      onToolConfigChange={handleToolConfigChange}
      onClose={clearSelection}
    />
  </div>
</div>
```

### 5. Update Event Handlers

**Before:**
```tsx
const handleToggleEditBoard = () => {
  setShowEditBoard(!showEditBoard);
};
```

**After:**
```tsx
// Selection is now handled by the sidebar
const handleNodeClick = (nodeId: string) => {
  selectNode(nodeId);
};
```

## Benefits of the New System

### 1. Better User Experience
- More space for complex configurations
- Real-time preview of changes
- Collapsible sidebar for more canvas space
- Keyboard shortcuts for common actions

### 2. Improved Performance
- Simplified node components render faster
- No complex UI elements in nodes
- Better separation of concerns

### 3. Enhanced Functionality
- Full-width components in sidebar
- Better form layouts
- Improved accessibility
- Responsive design

### 4. Easier Maintenance
- Clear separation between node display and configuration
- Reusable sidebar components
- Centralized configuration logic

## Keyboard Shortcuts

The new system supports the following keyboard shortcuts:

- `Ctrl/Cmd + S`: Save flow
- `Ctrl/Cmd + Enter`: Run flow
- `Ctrl/Cmd + Shift + Enter`: Compile flow
- `Escape`: Close sidebar/deselect node
- `Ctrl/Cmd + B`: Toggle sidebar

## Migration Checklist

- [ ] Remove `NodeEditBoard` imports from node components
- [ ] Remove `showEditBoard` state from node components
- [ ] Remove `handleToggleEditBoard` functions
- [ ] Update `NodeFactory` to create simplified nodes
- [ ] Add `NodeConfigSidebar` to `FlowBuilder`
- [ ] Implement node selection logic
- [ ] Update event handlers to use new selection system
- [ ] Test all node types work with the new sidebar
- [ ] Verify keyboard shortcuts work correctly
- [ ] Ensure all NodeEditBoard functionality is preserved

## Troubleshooting

### Common Issues

1. **Node not selectable**
   - Ensure nodes have click handlers
   - Check if `onNodeSelect` is passed to node components

2. **Sidebar not showing**
   - Verify `selectedNodeData` is being passed correctly
   - Check if `selectedNodeId` is set when clicking nodes

3. **Configuration not updating**
   - Ensure all handlers are properly connected
   - Check if update functions are being called correctly

4. **Styling issues**
   - Verify sidebar width classes are applied correctly
   - Check responsive breakpoints

## Support

If you encounter any issues during migration, please refer to the existing codebase examples or contact the development team.

## Timeline

- **Immediate**: Start using new sidebar alongside existing NodeEditBoard
- **Short-term**: Update all node components to remove NodeEditBoard
- **Medium-term**: Remove NodeEditBoard completely from the codebase
- **Long-term**: Update documentation and training materials