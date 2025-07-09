from typing import List, Dict


def convert_arguments(arguments: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """
    Convert a list of dictionaries with 'argument_name' and 'argument_value'
    keys into a list of dictionaries with direct key-value pairs.

    :param arguments: List of dictionaries with 'argument_name' and 'argument_value'.
    :return: List of dictionaries with direct key-value pairs.

    Example:
    input_data = [
        {'argument_name': 'product_name', 'argument_value': 'áo nam'},
        {'argument_name': 'price', 'argument_value': '100000'},
        {'argument_name': 'color', 'argument_value': 'đen'}
    ]

    >> [{'product_name': 'áo nam'}, {'price': '100000'}, {'color': 'đen'}]
    """
    converted_arguments = []

    for arg_dict in arguments:
        # Extract the argument name and value from each dictionary
        argument_name = arg_dict.get("argument_name")
        argument_value = arg_dict.get("argument_value")

        # Validate that both keys exist
        if argument_name is None or argument_value is None:
            raise ValueError(
                f"Each dictionary must contain 'argument_name' and 'argument_value'. Missing in {arg_dict}"
            )

        # Create a new dictionary with the extracted key-value pair
        converted_dict = {argument_name: argument_value}

        # Append the new dictionary to the result list
        converted_arguments.append(converted_dict)

    return converted_arguments


def convert_arguments_to_single_dict(arguments: List[Dict[str, str]]) -> Dict[str, str]:
    """
    Convert a list of dictionaries with 'argument_name' and 'argument_value'
    keys into a single dictionary with direct key-value pairs.

    :param arguments: List of dictionaries with 'argument_name' and 'argument_value'.
    :return: A single dictionary with direct key-value pairs.

    Example:
    input_data = [
        {'argument_name': 'product_name', 'argument_value': 'áo nam'},
        {'argument_name': 'price', 'argument_value': '100000'},
        {'argument_name': 'color', 'argument_value': 'đen'}
    ]

    >> {'product_name': 'áo nam', 'price': '100000', 'color': 'đen'}
    """
    converted_dict = {}

    for arg_dict in arguments:
        # Extract the argument name and value from each dictionary
        argument_name = arg_dict.get("argument_name")
        argument_value = arg_dict.get("argument_value")

        # Validate that both keys exist
        if argument_name is None or argument_value is None:
            raise ValueError(
                f"Each dictionary must contain 'argument_name' and 'argument_value'. Missing in {arg_dict}"
            )

        # Add the extracted key-value pair to the result dictionary
        converted_dict[argument_name] = argument_value

    return converted_dict
