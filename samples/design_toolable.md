

# Tool Parameter Design for HttpRequestNode

I understand your challenge with making HttpRequestNode work as a tool in your flowbuilder app. Let me break down the problem and propose a solution that balances backend simplicity, frontend implementation, and user experience.

## Analysis of Your Approaches

You've identified two main approaches for handling the JSON body:

### Approach A (Field-level toolable designation)
- **Pros**: Granular control over which parts of the JSON are toolable
- **Cons**: 
  - Complex user interface for nested structures
  - Potential conflicts with global variable syntax (`{{}}`)
  - Difficult to implement and parse

### Approach B (Schema-based)
- **Pros**: Cleaner separation of structure and parameters
- **Cons**: 
  - Schema definition can be challenging for users
  - Still complex for nested cases

## Recommended Solution: Parameter Mapping Interface

I recommend a hybrid approach that separates the JSON structure from tool parameter configuration:

### Backend Implementation

Define your HttpRequestNode spec with a clear separation:

```python
class HttpRequestNode(Node):
    # Non-tool fields
    url = TextField(...)
    method = DropdownField(...)
    
    # Toolable table fields
    headers = TableField(columns=[
        {"name": "key", "type": "text"},
        {"name": "value", "type": "text"},
        {"name": "toolable", "type": "checkbox"}
    ])
    
    query = TableField(columns=[
        {"name": "key", "type": "text"},
        {"name": "value", "type": "text"},
        {"name": "toolable", "type": "checkbox"}
    ])
    
    # Body configuration
    body_type = DropdownField(choices=["json", "form"])
    
    # For JSON body
    json_body_schema = TextField(help_text="Example JSON structure")
    json_body_parameters = DictField(default={}, help_text="Tool parameters mapping")
    
    # For Form body
    form_body = TableField(columns=[
        {"name": "key", "type": "text"},
        {"name": "value", "type": "text"},
        {"name": "toolable", "type": "checkbox"}
    ])
    
    can_be_tool = True
```

### Frontend Implementation

1. **For Headers and Query**: Continue with your checkbox approach - this works well.

2. **For JSON Body**:
   - Provide a JSON editor where users can input an example structure
   - Parse this example and automatically extract all fields (including nested ones)
   - Display these fields in a separate "Parameter Mapping" panel where users can:
     - Toggle toolable on/off for each field
     - Set default values for non-toolable fields
     - Specify data types and descriptions for toolable fields

3. **For Form Body**: Use the same checkbox approach as Headers/Query.

### User Workflow

1. User selects "JSON" as the body type
2. User pastes an example JSON structure:
   ```json
   {
     "user": {
       "name": "John",
       "age": 30
     },
     "settings": {
       "theme": "dark",
       "notifications": true
     }
   }
   ```
3. System automatically extracts all fields and displays them in a tree structure:
   ```
   [-] user
       [ ] name (toolable: ☐, default: "John")
       [ ] age (toolable: ☐, default: 30)
   [-] settings
       [ ] theme (toolable: ☐, default: "dark")
       [ ] notifications (toolable: ☐, default: true)
   ```
4. User checks which fields should be toolable and provides defaults for others
5. System generates the parameter mapping based on user selections

### Backend Processing

When the node is used as a tool:
1. Backend receives parameter values from the AI agent
2. Merges these with default values
3. Constructs the final JSON body according to the schema
4. Makes the HTTP request

## Advantages of This Approach

1. **Backend simplicity**: Clear separation between structure and parameters
2. **Frontend clarity**: Focused UI for parameter mapping without complex syntax
3. **User experience**: Intuitive visual approach without learning special syntax
4. **Nested structure support**: Tree view naturally handles nested JSON
5. **Global variable compatibility**: No conflict with `{{}}` syntax
6. **Extensibility**: Easy to add more parameter options (descriptions, validation, etc.)

## Alternative: Template-based Simplification

If the above seems too complex, consider a simpler template approach:

```json
{
  "user": {
    "name": "{{name:str}}",
    "age": "{{age:int}}"
  },
  "settings": {
    "theme": "{{theme:str|default:'dark'}}",
    "notifications": "{{notifications:bool|default:true}}"
  }
}
```

With this approach:
- Backend just needs to parse the template and extract parameters
- Frontend can provide syntax highlighting and validation
- Users only need to learn one simple syntax
- Global variables can use a different syntax (like `{{global:variable_name}}`)

## Final Recommendation

I'd go with the Parameter Mapping Interface as the primary solution because it provides the best balance of usability and implementation complexity. It avoids syntax conflicts, handles nested structures well, and provides a clear separation of concerns.

Would you like me to elaborate on any specific aspect of this solution?