{
    "name": "One-in-One-out Node",
    "description": "A node that accepts user input and returns a message.",
    "inputs": [
        {
            "name": "message_in",
            "type": {
                "type": "TextFieldInputHandle",
                "schema": {
                    "description": "Handle for text field inputs",
                    "properties": {
                        "dynamic": {
                            "default": false,
                            "title": "Dynamic",
                            "type": "boolean"
                        },
                        "resolver": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "default": null,
                            "title": "Resolver"
                        },
                        "depends_on": {
                            "items": {
                                "type": "string"
                            },
                            "title": "Depends On",
                            "type": "array"
                        },
                        "load_on_init": {
                            "default": true,
                            "title": "Load On Init",
                            "type": "boolean"
                        },
                        "reload_on_change": {
                            "default": true,
                            "title": "Reload On Change",
                            "type": "boolean"
                        },
                        "placeholder": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "default": null,
                            "title": "Placeholder"
                        },
                        "max_length": {
                            "anyOf": [
                                {
                                    "type": "integer"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "default": null,
                            "title": "Max Length"
                        },
                        "multiline": {
                            "default": false,
                            "title": "Multiline",
                            "type": "boolean"
                        }
                    },
                    "title": "TextFieldInputHandle",
                    "type": "object"
                },
                "defaults": {
                    "dynamic": false,
                    "depends_on": [],
                    "load_on_init": true,
                    "reload_on_change": true,
                    "placeholder": "Enter a message",
                    "max_length": 100,
                    "multiline": true
                }
            },
            "value": null,
            "default": null,
            "description": "The message to be sent.",
            "required": false
        },
        {
            "name": "departments",
            "type": {
                "type": "DropdownInputHandle",
                "schema": {
                    "description": "Handle for dropdown/select inputs",
                    "properties": {
                        "dynamic": {
                            "default": false,
                            "title": "Dynamic",
                            "type": "boolean"
                        },
                        "resolver": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "default": null,
                            "title": "Resolver"
                        },
                        "depends_on": {
                            "items": {
                                "type": "string"
                            },
                            "title": "Depends On",
                            "type": "array"
                        },
                        "load_on_init": {
                            "default": true,
                            "title": "Load On Init",
                            "type": "boolean"
                        },
                        "reload_on_change": {
                            "default": true,
                            "title": "Reload On Change",
                            "type": "boolean"
                        },
                        "options": {
                            "items": {
                                "type": "object"
                            },
                            "title": "Options",
                            "type": "array"
                        },
                        "multiple": {
                            "default": false,
                            "title": "Multiple",
                            "type": "boolean"
                        },
                        "searchable": {
                            "default": false,
                            "title": "Searchable",
                            "type": "boolean"
                        }
                    },
                    "title": "DropdownInputHandle",
                    "type": "object"
                },
                "defaults": {
                    "dynamic": false,
                    "depends_on": [],
                    "load_on_init": true,
                    "reload_on_change": true,
                    "options": [],
                    "multiple": false,
                    "searchable": false
                }
            },
            "value": null,
            "default": null,
            "description": "The message to be sent.",
            "required": false
        }
    ],
    "outputs": [
        {
            "name": "message_out",
            "type": "str",
            "value": null,
            "default": null,
            "description": "The message received."
        }
    ],
    "parameters": {},
    "can_be_tool": false
}