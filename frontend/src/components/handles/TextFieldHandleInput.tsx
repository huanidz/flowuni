import React from "react";

interface TextFieldHandleInputProps {
  label: string;
  description?: string;
  value: any;
  onChange?: (value: string) => void;
  nodeId?: string;
  parameterName?: string;
}

export const TextFieldHandleInput: React.FC<TextFieldHandleInputProps> = ({
  label,
  description,
  value,
  onChange,
  nodeId,
  parameterName,
}) => {
  const handleChange = (newValue: string) => {
    console.log(`Input changed: ${newValue} for node ${nodeId} param ${parameterName}`);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", fontSize: "12px", width: "100%" }}>
      {label && (
        <label style={{ marginBottom: "4px", fontWeight: "bold", color: "#333" }}>
          {label}
        </label>
      )}
      {description && (
        <span style={{ marginBottom: "4px", color: "#666", fontSize: "11px" }}>
          {description}
        </span>
      )}
      <input
        type="text"
        value={value || ""}
        onChange={(e) => handleChange(e.target.value)}
        className="nodrag"
        style={{
          padding: "6px 8px",
          fontSize: "12px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          width: "100%",
          boxSizing: "border-box",
          outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#007bff";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#ccc";
        }}
      />
    </div>
  );
};