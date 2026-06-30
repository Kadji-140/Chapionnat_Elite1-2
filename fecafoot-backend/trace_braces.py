import os

def unflatten():
    filepath = r'c:\Users\User\Desktop\championnat\fecafoot-backend\database\seeders\FecafootCompleteSeeder.php'
    content = open(filepath, 'r', encoding='utf-8').read()

    triggers = [
        'private ', 'public ', 'protected ', 'class ', 'use ', 'namespace ',
        'foreach ', 'for ', 'if ', 'return ', 'try ', 'catch ',
        ' }', ' } ', ' [$', ' $', ' [\'', ' \'', ' "',
        '// =========================================================================',
        '// MODULE', '// TRUNCATE', '// Noms', '// Distribution',
        '// Centraux', '// Assistants', '// Quatriemes', '// Saisons',
        '// - 20', '// Matches', '// Classement', '// Match ', '// Matchs',
        '// Journées', '// ── ', '// Scores', '// Résultats', '// Canon',
        '// Convertir', '// Récupérer', '// Début', '// Buts', '// Cartons',
        '// Fin', '// Feuille', '// Top', '// Mettre', '// Ajouter',
        '// Forme', '// Mise', '// Seeding', '// Historique', '// Un ',
        '// Transferts', '// [BROUILLON]', '// Compositions', '// Helpers'
    ]

    out = []
    in_comment = False
    in_string = None
    escaped = False

    i = 0
    n = len(content)
    while i < n:
        char = content[i]

        # Handle string literals in the outer parser to avoid splitting strings
        if not in_comment:
            if escaped:
                escaped = False
            elif char == '\\':
                escaped = True
            elif char in ['"', "'"]:
                if in_string == char:
                    in_string = None
                elif in_string is None:
                    in_string = char

        if in_string:
            out.append(char)
            i += 1
            continue

        # If we see a comment start
        if not in_comment and char == '/' and i + 1 < n and content[i+1] == '/':
            in_comment = True
            out.append('\n')  # insert newline before comment starts
            out.append('//')
            i += 2
            continue

        if in_comment:
            if char == '\n':
                in_comment = False
            else:
                # Check triggers to end the comment and insert newline
                matched_trigger = None
                for t in triggers:
                    if content[i:].startswith(t):
                        matched_trigger = t
                        break
                if matched_trigger:
                    out.append('\n')
                    in_comment = False

        out.append(char)
        i += 1

    unflattened = "".join(out)

    # Let's verify brace matching on the unflattened content
    stack = []
    for char in unflattened:
        if char == '{':
            stack.append(char)
        elif char == '}':
            if stack:
                stack.pop()

    print(f"Brace stack size of unflattened content: {len(stack)}")

    # Write the unflattened content back to the seeder file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(unflattened)
    print("Seeder file unflattened successfully.")

if __name__ == '__main__':
    unflatten()
