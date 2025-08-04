import React from 'react';
import { TextFieldHandleInput } from './basics/TextFieldHandleInput';
import { DropdownHandleInput } from './basics/DropdownHandleInput';
import { SecretTextHandleInput } from './basics/SecretTextHandleInput';

export type NodeInputType =
  | 'TextFieldInputHandle'
  | 'DropdownInputHandle'
  | 'SecretTextInputHandle' /* etc. */;

export const NodeInputType = {
  TextField: 'TextFieldInputHandle',
  Dropdown: 'DropdownInputHandle',
  SecretText: 'SecretTextInputHandle',
} as const;



export const HandleComponentRegistry: {
  [key: string]: React.FC<any>; // You can refine `any` to a base input props type if needed
} = {
  [NodeInputType.TextField]: TextFieldHandleInput,
  [NodeInputType.Dropdown]: DropdownHandleInput,
  [NodeInputType.SecretText]: SecretTextHandleInput,
};
