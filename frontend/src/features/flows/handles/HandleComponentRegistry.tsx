import React from 'react';
import { TextFieldHandleInput } from './basics/TextFieldHandleInput';
import { DropdownHandleInput } from './basics/DropdownHandleInput';
import { SecretTextHandleInput } from './basics/SecretTextHandleInput';
import { AgentToolHandleInput } from './basics/AgentToolHandleInput';

export type NodeInputType =
  | 'TextFieldInputHandle'
  | 'DropdownInputHandle'
  | 'SecretTextInputHandle'
  | 'AgentToolInputHandle' /* etc. */;

export const NodeInputType = {
  TextField: 'TextFieldInputHandle',
  Dropdown: 'DropdownInputHandle',
  SecretText: 'SecretTextInputHandle',
  AgentTool: 'AgentToolInputHandle',
} as const;



export const HandleComponentRegistry: {
  [key: string]: React.FC<any>; // You can refine `any` to a base input props type if needed
} = {
  [NodeInputType.TextField]: TextFieldHandleInput,
  [NodeInputType.Dropdown]: DropdownHandleInput,
  [NodeInputType.SecretText]: SecretTextHandleInput,
  [NodeInputType.AgentTool]: AgentToolHandleInput,
};

// ===========================================================================
