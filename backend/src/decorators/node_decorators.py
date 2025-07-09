from functools import wraps

def enforce_spec(func):
    @wraps(func)
    def wrapper(self, inputs: dict, parameters: dict):
        # ---- INPUT ENFORCEMENT ----
        input_map = {}
        for input_spec in self.spec.inputs:
            name = input_spec.name
            value = inputs.get(name, input_spec.default)
            if value is None and input_spec.required:
                raise ValueError(f"Missing required input: '{name}'")
            input_map[name] = value

        # ---- PARAMETER ENFORCEMENT ----
        param_map = {}
        for param_name, param_spec in self.spec.parameters.items():
            param_map[param_name] = parameters.get(param_name, param_spec.default)

        # ---- CALL PROCESS ----
        result = func(self, input_map, param_map)

        # ---- OUTPUT ENFORCEMENT ----
        output_names = [out.name for out in self.spec.outputs]

        if len(output_names) == 1:
            # Wrap single output value in a dict if not already
            if not isinstance(result, dict):
                result = {output_names[0]: result}
        elif not isinstance(result, dict):
            raise ValueError(f"Expected a dict of outputs, got: {type(result)}")

        # Check if all declared outputs are present
        for name in output_names:
            if name not in result:
                raise ValueError(f"Missing output key: '{name}' in result: {result}")

        # Optional: check for extra undeclared outputs
        extra_keys = set(result.keys()) - set(output_names)
        if extra_keys:
            raise ValueError(f"Unexpected output keys: {extra_keys}. Only allowed: {output_names}")

        return result

    return wrapper
