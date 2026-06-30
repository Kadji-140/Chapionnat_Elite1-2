import sys

def check_braces():
    filepath = r'c:\Users\User\Desktop\championnat\fecafoot-backend\database\seeders\FecafootCompleteSeeder.php'
    try:
        content = open(filepath, 'r', encoding='utf-8').read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    stack = []
    in_string = None
    in_single_line_comment = False
    in_multi_line_comment = False
    escaped = False

    i = 0
    n = len(content)
    while i < n:
        char = content[i]

        if in_single_line_comment:
            if char == '\n':
                in_single_line_comment = False
            i += 1
            continue

        if in_multi_line_comment:
            if char == '*' and i + 1 < n and content[i+1] == '/':
                in_multi_line_comment = False
                i += 2
            else:
                i += 1
            continue

        if escaped:
            escaped = False
            i += 1
            continue

        if char == '\\':
            escaped = True
            i += 1
            continue

        if char in ['"', "'"]:
            if in_string == char:
                in_string = None
            elif in_string is None:
                in_string = char
            i += 1
            continue

        if in_string:
            i += 1
            continue

        if char == '/' and i + 1 < n:
            if content[i+1] == '/':
                in_single_line_comment = True
                i += 2
                continue
            elif content[i+1] == '*':
                in_multi_line_comment = True
                i += 2
                continue

        if char == '{':
            stack.append((i, char))
        elif char == '}':
            if stack:
                stack.pop()
            else:
                print(f"Extra closing brace at char {i}")

        i += 1

    print(f"Braces stack size at the end: {len(stack)}")
    if stack:
        print("Unclosed braces details:")
        for idx, char in stack:
            snippet = content[max(0, idx-40):min(n, idx+60)]
            safe_snippet = snippet.encode('ascii', errors='ignore').decode('ascii')
            print(f"Index {idx} Snippet:\n{safe_snippet}\n" + "="*40)

if __name__ == '__main__':
    check_braces()
