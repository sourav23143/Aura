import os
import re

directories = ['frontend', 'backend']
exclude_dirs = ['node_modules', '.git', 'venv', '__pycache__', '.env', 'package-lock.json']

replacements = [
    (r'\bCortexAI\b', 'AuraAI'),
    (r'\bcortexai\b', 'auraai'),
    (r'\bCortex\b', 'Aura'),
    (r'\bcortex\b', 'aura')
]

for d in directories:
    for root, dirs, files in os.walk(d):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if file.endswith(('.js', '.jsx', '.py', '.json', '.html', '.css', '.md')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = content
                    for pattern, repl in replacements:
                        new_content = re.sub(pattern, repl, new_content)
                    
                    if new_content != content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f'Updated {filepath}')
                except Exception as e:
                    print(f'Error reading {filepath}: {e}')
