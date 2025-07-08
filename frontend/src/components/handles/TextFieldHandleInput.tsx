import React from "react";

interface TextFieldHandleInputProps {
  label: string;
  description?: string;
  value: any;
  onChange?: (value: string) => void;
}

export const TextFieldHandleInput: React.FC<TextFieldHandleInputProps> = ({
  value,
  onChange,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", fontSize: "12px", width: "100%" }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="nodrag"
        style={{
          padding: "4px 6px",
          fontSize: "12px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          width: "100%",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
};
