import ast
import math
import operator


def safe_eval(expression):  # noqa
    """
    Safely evaluates a mathematical expression string.

    Supported operations:
    - Basic arithmetic: +, -, *, /, //, %, **
    - Unary operations: +x, -x
    - Mathematical functions: sin, cos, tan, log, sqrt, etc.
    - Constants: pi, e
    - Parentheses for grouping

    Args:
        expression (str): The mathematical expression to evaluate

    Returns:
        float/int: The result of the expression

    Raises:
        ValueError: If the expression contains unsupported operations
        SyntaxError: If the expression has invalid syntax
    """

    # Define allowed operations
    operators = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.FloorDiv: operator.floordiv,
        ast.Mod: operator.mod,
        ast.Pow: operator.pow,
        ast.USub: operator.neg,
        ast.UAdd: operator.pos,
    }

    # Define allowed functions and constants
    functions = {
        "abs": abs,
        "round": round,
        "min": min,
        "max": max,
        "sum": sum,
        # Math module functions
        "sin": math.sin,
        "cos": math.cos,
        "tan": math.tan,
        "asin": math.asin,
        "acos": math.acos,
        "atan": math.atan,
        "atan2": math.atan2,
        "sinh": math.sinh,
        "cosh": math.cosh,
        "tanh": math.tanh,
        "log": math.log,
        "log10": math.log10,
        "log2": math.log2,
        "exp": math.exp,
        "sqrt": math.sqrt,
        "ceil": math.ceil,
        "floor": math.floor,
        "degrees": math.degrees,
        "radians": math.radians,
        "factorial": math.factorial,
        # Constants
        "pi": math.pi,
        "e": math.e,
        "tau": math.tau,
        "inf": math.inf,
        "nan": math.nan,
    }

    def _eval_node(node):  # noqa
        """Recursively evaluate AST nodes"""
        if isinstance(node, ast.Expression):
            return _eval_node(node.body)

        elif isinstance(node, ast.Constant):  # Numbers
            return node.value

        elif isinstance(node, ast.Name):  # Variables/constants
            if node.id in functions:
                return functions[node.id]
            else:
                raise ValueError(f"Undefined variable: {node.id}")

        elif isinstance(node, ast.BinOp):  # Binary operations
            left = _eval_node(node.left)
            right = _eval_node(node.right)
            op = operators.get(type(node.op))
            if op is None:
                raise ValueError(f"Unsupported operation: {type(node.op).__name__}")
            return op(left, right)

        elif isinstance(node, ast.UnaryOp):  # Unary operations
            operand = _eval_node(node.operand)
            op = operators.get(type(node.op))
            if op is None:
                raise ValueError(
                    f"Unsupported unary operation: {type(node.op).__name__}"
                )
            return op(operand)

        elif isinstance(node, ast.Call):  # Function calls
            func = _eval_node(node.func)
            if not callable(func):
                raise ValueError(f"'{func}' is not a function")

            args = [_eval_node(arg) for arg in node.args]
            kwargs = {kw.arg: _eval_node(kw.value) for kw in node.keywords}

            return func(*args, **kwargs)

        elif isinstance(node, ast.List):  # Lists
            return [_eval_node(item) for item in node.elts]

        elif isinstance(node, ast.Tuple):  # Tuples
            return tuple(_eval_node(item) for item in node.elts)

        else:
            raise ValueError(f"Unsupported node type: {type(node).__name__}")

    try:
        # Parse the expression into an AST
        tree = ast.parse(expression, mode="eval")
        # Evaluate the AST
        result = _eval_node(tree)
        return result

    except SyntaxError as e:
        raise SyntaxError(f"Invalid expression syntax: {e}")
    except Exception as e:
        raise ValueError(f"Error evaluating expression: {e}")
