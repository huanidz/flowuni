def horizontal_line(char="-", length=80):
    return char * length


def vertical_line(char="|", height=10):
    result = ""
    for _ in range(height):
        result += char + "\n"
    return result


def print_table(data, headers=None):
    if headers:
        print(horizontal_line())
        print(" | ".join(headers))
        print(horizontal_line())
    for row in data:
        print(" | ".join(str(x) for x in row))
    print(horizontal_line())


def indent_text(text, indent=4):
    return " " * indent + text


def print_header(text, char="=", length=80):
    print(char * length)
    print(text.center(length))
    print(char * length)


def print_footer(text, char="=", length=80):
    print(char * length)
    print(text.center(length))
    print(char * length)
