from .ToolBase import BaseTool, ToolResult
from typing import Dict, Any

class CalculatorTool(BaseTool):
    @property
    def name(self) -> str:
        return "calculator"
    
    @property
    def description(self) -> str:
        return "Perform mathematical calculations"
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "expression": {
                "type": "string",
                "description": "Mathematical expression to calculate (e.g., '2 + 3 * 4')"
            }
        }
    
    def execute(self, expression: str) -> ToolResult:
        try:
            # Chỉ cho phép các operation an toàn
            allowed_chars = set('0123456789+-*/()., ')
            if not all(c in allowed_chars for c in expression):
                return ToolResult(False, None, "Invalid characters in expression")
            
            result = eval(expression)
            return ToolResult(True, result)
        except Exception as e:
            return ToolResult(False, None, str(e))