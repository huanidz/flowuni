import React from 'react';
import { TextFieldHandleInput } from './basics/TextFieldHandleInput';
import { DropdownHandleInput } from './basics/DropdownHandleInput';
import { SecretTextHandleInput } from './basics/SecretTextHandleInput';
import { AgentToolHandleInput } from './basics/AgentToolHandleInput';
import { TableHandleInput } from './basics/TableHandleInput';
import { DynamicTypeHandleInput } from './basics/DynamicTypeHandleInput';
import { ToolableJsonHandleInput } from './basics/ToolableJsonHandleInput';

export type NodeInputType =
    | 'TextFieldInputHandle'
    | 'DropdownInputHandle'
    | 'SecretTextInputHandle'
    | 'AgentToolInputHandle'
    | 'TableInputHandle'
    | 'DynamicTypeInputHandle'
    | 'ToolableJsonInputHandle' /* etc. */;

export const NodeInputType = {
    TextField: 'TextFieldInputHandle',
    Dropdown: 'DropdownInputHandle',
    SecretText: 'SecretTextInputHandle',
    AgentTool: 'AgentToolInputHandle',
    Table: 'TableInputHandle',
    DynamicType: 'DynamicTypeInputHandle',
    ToolableJson: 'ToolableJsonInputHandle',
} as const;

export const HandleComponentRegistry: {
    [key: string]: React.FC<any>; // You can refine `any` to a base input props type if needed
} = {
    [NodeInputType.TextField]: TextFieldHandleInput,
    [NodeInputType.Dropdown]: DropdownHandleInput,
    [NodeInputType.SecretText]: SecretTextHandleInput,
    [NodeInputType.AgentTool]: AgentToolHandleInput,
    [NodeInputType.Table]: TableHandleInput,
    [NodeInputType.DynamicType]: DynamicTypeHandleInput,
    [NodeInputType.ToolableJson]: ToolableJsonHandleInput,
};

// ===========================================================================
