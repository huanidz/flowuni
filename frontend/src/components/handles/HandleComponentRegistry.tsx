import React from "react";
import { NodeInputType } from "@/types/NodeIOHandleType";
import { TextFieldHandleInput } from "./TextFieldHandleInput";

export const HandleComponentRegistry: {
  [key: string]: React.FC<any>; // You can refine `any` to a base input props type if needed
} = {
  [NodeInputType.TextField]: TextFieldHandleInput,
};