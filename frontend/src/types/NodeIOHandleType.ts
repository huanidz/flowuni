export type NodeInputType = "TextFieldInputHandle" | "DropdownInputHandle" /* etc. */;

export const NodeInputType = {
  TextField: "TextFieldInputHandle",
  Dropdown: "DropdownInputHandle",
} as const;