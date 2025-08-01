import React from 'react';
import { TextFieldHandleInput } from './TextFieldHandleInput';

export type NodeInputType =
  | 'TextFieldInputHandle'
  | 'DropdownInputHandle' /* etc. */;

export const NodeInputType = {
  TextField: 'TextFieldInputHandle',
  Dropdown: 'DropdownInputHandle',
} as const;



export const HandleComponentRegistry: {
  [key: string]: React.FC<any>; // You can refine `any` to a base input props type if needed
} = {
  [NodeInputType.TextField]: TextFieldHandleInput,
};
