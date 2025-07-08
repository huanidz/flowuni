import { HandleType } from "@/types/NodeIOHandleType";
import { TextFieldHandleInput } from "./TextFieldHandleInput";

export const HandleComponentRegistry = {
  [HandleType.TextField]: TextFieldHandleInput,
};