from src.nodes.NodeBase import Node, NodeSpec, NodeInput, NodeOutput

class StringTransformNode(Node):

    spec: NodeSpec = NodeSpec(
        name="String Transform",
        description="A node that transforms a string.",
        inputs=[
            NodeInput(name="input", type=str, description="The string to be transformed.")
        ],
        outputs=[
            NodeOutput(name="output", type=str, description="The transformed string.")
        ],
        parameters={}
    )

    def process(self, inputs, parameters):
        input_string = inputs["input"]
        
        # Implement your transformation logic here
        transformed_string = input_string.upper()

        return {"output": transformed_string}