#!/usr/bin/env python3
"""
Extract TypeScript type definitions from OpenAPI-generated types.ts
Creates standalone type files in src/Query/Types/
"""

import re
import os
from pathlib import Path

# Configuration
TYPES_FILE = "src/types.ts"
OUTPUT_DIR = "src/Query/Types"

# ANSI color codes
class Colors:
    BLUE = '\033[0;34m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    RED = '\033[0;31m'
    NC = '\033[0m'  # No Color

def print_header():
    print(f"{Colors.BLUE}╔════════════════════════════════════════════════╗{Colors.NC}")
    print(f"{Colors.BLUE}║   TypeScript Type Extraction Script           ║{Colors.NC}")
    print(f"{Colors.BLUE}╚════════════════════════════════════════════════╝{Colors.NC}")
    print()

def extract_schemas(content):
    """Extract all schema definitions from the types.ts content"""
    # Find the schemas section
    schemas_match = re.search(r'schemas:\s*\{', content)
    if not schemas_match:
        raise ValueError("Could not find 'schemas:' section in types.ts")
    
    start_pos = schemas_match.end()
    
    # Find the matching closing brace for schemas
    brace_count = 1
    pos = start_pos
    while pos < len(content) and brace_count > 0:
        if content[pos] == '{':
            brace_count += 1
        elif content[pos] == '}':
            brace_count -= 1
        pos += 1
    
    schemas_content = content[start_pos:pos-1]
    return schemas_content

def parse_type_definitions(schemas_content):
    """Parse individual type definitions from schemas content"""
    types = {}
    lines = schemas_content.split('\n')
    i = 0
    
    while i < len(lines):
        line = lines[i]
        # Match type definition start: "    TypeName: {" or "    TypeName: string..."
        # Updated to support hyphens in type names (e.g., BankAccount-Input)
        match = re.match(r'^\s+"?([A-Z][a-zA-Z0-9_-]*)"?:\s*(.*)$', line)
        
        if match:
            type_name = match.group(1)
            rest_of_line = match.group(2)
            
            # Check if it's a simple type (no opening brace) or complex type
            if '{' in rest_of_line:
                # Complex type - find matching closing brace
                type_def = [line]
                brace_count = rest_of_line.count('{') - rest_of_line.count('}')
                i += 1
                
                while i < len(lines) and brace_count > 0:
                    type_def.append(lines[i])
                    brace_count += lines[i].count('{') - lines[i].count('}')
                    i += 1
                
                types[type_name] = {
                    'kind': 'interface',
                    'definition': '\n'.join(type_def)
                }
            else:
                # Simple type (enum or union)
                types[type_name] = {
                    'kind': 'type',
                    'definition': line
                }
                i += 1
        else:
            i += 1
    
    return types

def sanitize_type_name(type_name):
    """Sanitize type name to be a valid TypeScript identifier"""
    # Replace hyphens with underscores to make valid TS identifiers
    return type_name.replace('-', '_')

def extract_referenced_types(type_def):
    """Extract all type references from a type definition"""
    # Find all components["schemas"]["TypeName"] references
    pattern = r'components\["schemas"\]\["([^"]+)"\]'
    matches = re.findall(pattern, type_def)
    # Sanitize all referenced type names
    return set(sanitize_type_name(m) for m in matches)

def reindent_body(lines, indent="    "):
    """
    Re-indent an interface body to a single level.

    Bodies lifted out of types.ts carry the indentation of their original nesting
    (components -> schemas -> TypeName), so strip the common leading whitespace and
    re-apply the project's 4-space indent, preserving any relative nesting.
    """
    non_blank = [line for line in lines if line.strip()]
    if not non_blank:
        return lines

    base = min(len(line) - len(line.lstrip()) for line in non_blank)

    reindented = []
    for line in lines:
        if not line.strip():
            reindented.append("")
        else:
            reindented.append(indent + line[base:])
    return reindented

def clean_type_definition(type_def, type_name, kind):
    """Clean up a type definition for output"""
    referenced_types = set()
    
    if kind == 'interface':
        # Remove first line (TypeName: {) and last line (};)
        lines = type_def.split('\n')
        body_lines = lines[1:-1]  # Skip first and last
        
        # Replace components["schemas"]["TypeName"] with sanitized TypeName and track references
        cleaned_lines = []
        for line in body_lines:
            # Find all referenced types in this line
            refs = re.findall(r'components\["schemas"\]\["([^"]+)"\]', line)
            # Sanitize and add to referenced types
            referenced_types.update(sanitize_type_name(ref) for ref in refs)
            
            # Replace with sanitized type name
            def replace_with_sanitized(match):
                original_name = match.group(1)
                return sanitize_type_name(original_name)
            
            cleaned = re.sub(r'components\["schemas"\]\["([^"]+)"\]', replace_with_sanitized, line)
            cleaned_lines.append(cleaned)

        return '\n'.join(reindent_body(cleaned_lines)), referenced_types
    else:
        # Simple type - extract after colon
        match = re.search(r':\s*(.+);?\s*$', type_def)
        if match:
            content = match.group(1).rstrip(';')
            # Check for referenced types in union/enum types
            refs = re.findall(r'components\["schemas"\]\["([^"]+)"\]', content)
            # Sanitize and add to referenced types
            referenced_types.update(sanitize_type_name(ref) for ref in refs)
            
            # Replace with sanitized type name
            def replace_with_sanitized(match):
                original_name = match.group(1)
                return sanitize_type_name(original_name)
            
            content = re.sub(r'components\["schemas"\]\["([^"]+)"\]', replace_with_sanitized, content)
            return content, referenced_types
        return type_def, referenced_types

def is_enum_type(cleaned_def):
    """Check if a type definition is an enum (union of string literals)"""
    # Check if it's a union of string literals: "Value1" | "Value2" | ...
    return bool(re.match(r'^"[^"]*"(\s*\|\s*"[^"]*")+$', cleaned_def.strip()))

def extract_enum_values(cleaned_def):
    """Extract individual string values from an enum type definition"""
    # Find all quoted strings in the union type
    return re.findall(r'"([^"]*)"', cleaned_def)

def create_type_file(type_name, kind, cleaned_def, referenced_types, output_dir):
    """Create a TypeScript file for the type"""
    filename = f"{type_name}.ts"
    filepath = output_dir / filename
    has_list = False
    
    with open(filepath, 'w') as f:
        f.write("/**\n")
        f.write(" * Auto-generated type definition\n")
        f.write(" * Extracted from OpenAPI schema\n")
        f.write(" */\n\n")
        
        # Add imports for referenced types
        if referenced_types:
            for ref_type in sorted(referenced_types):
                f.write(f'import type {{ {ref_type} }} from "./{ref_type}";\n')
            f.write("\n")
        
        if kind == 'interface':
            f.write(f"export interface {type_name} {{\n")
            f.write(cleaned_def)
            f.write("\n}\n")
        else:
            f.write(f"export type {type_name} = {cleaned_def};\n")
            
            # Check if this is an enum type and generate list
            if is_enum_type(cleaned_def):
                has_list = True
                enum_values = extract_enum_values(cleaned_def)
                f.write("\n")
                f.write(f"export const {type_name}List: string[] = [\n")
                for value in enum_values:
                    f.write(f'    "{value}",\n')
                f.write("];\n")
    
    return filename, has_list

def create_index_file(type_info_map, output_dir):
    """Create index.ts file that exports all types and their lists"""
    index_path = output_dir / "index.ts"
    
    with open(index_path, 'w') as f:
        f.write("/**\n")
        f.write(" * Auto-generated type exports\n")
        f.write(" * Extracted from OpenAPI schema types.ts\n")
        f.write(" * \n")
        f.write(" * Usage:\n")
        f.write(" *   import type { TypeName } from '@/Query/Types';\n")
        f.write(" *   import { TypeNameList } from '@/Query/Types';  // For enum lists\n")
        f.write(" * \n")
        f.write(" * This file provides direct access to all schema types without\n")
        f.write(" * needing to use components[\"schemas\"][\"TypeName\"] syntax.\n")
        f.write(" */\n\n")
        
        # Export all types
        for type_name in sorted(type_info_map.keys()):
            f.write(f'export type {{ {type_name} }} from "./{type_name}";\n')
        
        # Add a separator
        f.write("\n// Enum value lists\n")
        
        # Export all enum lists
        for type_name, type_info in sorted(type_info_map.items()):
            if type_info.get('has_list', False):
                f.write(f'export {{ {type_name}List }} from "./{type_name}";\n')

def main():
    print_header()
    
    # Check if types.ts exists
    if not os.path.exists(TYPES_FILE):
        print(f"{Colors.RED}Error: {TYPES_FILE} not found!{Colors.NC}")
        return 1
    
    # Create output directory
    output_dir = Path(OUTPUT_DIR)
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"{Colors.GREEN}✓ Output directory: {OUTPUT_DIR}{Colors.NC}")
    
    # Read types.ts
    print(f"{Colors.BLUE}→ Parsing {TYPES_FILE}...{Colors.NC}")
    with open(TYPES_FILE, 'r') as f:
        content = f.read()
    
    # Extract schemas section
    try:
        schemas_content = extract_schemas(content)
    except ValueError as e:
        print(f"{Colors.RED}✗ {e}{Colors.NC}")
        return 1
    
    # Parse type definitions
    types = parse_type_definitions(schemas_content)
    print(f"{Colors.GREEN}✓ Extracted {len(types)} type definitions{Colors.NC}")
    print()
    
    # Create type files
    print(f"{Colors.BLUE}→ Creating type files...{Colors.NC}")
    type_info_map = {}
    
    for type_name, type_info in types.items():
        kind = type_info['kind']
        definition = type_info['definition']
        
        # Sanitize type name for valid TypeScript identifier
        sanitized_name = sanitize_type_name(type_name)
        
        cleaned_def, referenced_types = clean_type_definition(definition, type_name, kind)
        filename, has_list = create_type_file(sanitized_name, kind, cleaned_def, referenced_types, output_dir)
        type_info_map[sanitized_name] = {'has_list': has_list}
        print(f"  {Colors.GREEN}✓{Colors.NC} {filename}")
    
    # Create index file
    create_index_file(type_info_map, output_dir)
    
    print()
    print(f"{Colors.GREEN}╔════════════════════════════════════════════════╗{Colors.NC}")
    print(f"{Colors.GREEN}║           Extraction Complete!                 ║{Colors.NC}")
    print(f"{Colors.GREEN}╚════════════════════════════════════════════════╝{Colors.NC}")
    print(f"{Colors.BLUE}  Types extracted: {Colors.GREEN}{len(type_info_map)}{Colors.NC}")
    print(f"{Colors.BLUE}  Output location: {Colors.GREEN}{OUTPUT_DIR}{Colors.NC}")
    print(f"{Colors.BLUE}  Index file:      {Colors.GREEN}{OUTPUT_DIR}/index.ts{Colors.NC}")
    print()
    print(f"{Colors.YELLOW}Next steps:{Colors.NC}")
    print(f"  1. Review generated files in {OUTPUT_DIR}")
    print(f"  2. Replace {Colors.YELLOW}components[\"schemas\"][\"TypeName\"]{Colors.NC} with {Colors.GREEN}import type {{ TypeName }} from '../../Query/Types'{Colors.NC}")
    print("  3. Update tsconfig.json paths if needed")
    print()
    
    return 0

if __name__ == "__main__":
    exit(main())
