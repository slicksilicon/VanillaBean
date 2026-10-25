#!/bin/bash

# Configuration
OPENAPI_FILE="openapi.json"
OUTPUT_DIR="./src/" # The directory where types.ts will be placed
TYPES_FILE="types.ts"
FULL_OUTPUT_PATH="${OUTPUT_DIR}/${TYPES_FILE}"

# --- Pre-requisites Check ---
echo "--- Checking Pre-requisites ---"
# Check if openapi.json exists
if [ ! -f "$OPENAPI_FILE" ]; then
    echo "Error: '$OPENAPI_FILE' not found in the current directory. Please ensure it exists."
    exit 1
fi

# Check if npx is available (it should be if npm is recent)
if ! command -v npx &> /dev/null; then
    echo "Error: 'npx' command not found. Please ensure you have npm version 5.2.0 or higher installed."
    exit 1
fi

# We will rely on npx to find openapi-typescript, so no direct check for openapi-typescript is needed here.
# npx will automatically look in node_modules/.bin/

# --- Directory Setup ---
echo "--- Setting up Output Directory ---"
mkdir -p "$OUTPUT_DIR" || { echo "Error: Failed to create directory '$OUTPUT_DIR'. Exiting."; exit 1; }
echo "Ensured output directory '$OUTPUT_DIR' exists."

# --- Type Generation ---
echo "--- Generating TypeScript Types ---"
echo "Generating types from '$OPENAPI_FILE' to '$FULL_OUTPUT_PATH' using npx openapi-typescript..."

# Run openapi-typescript using npx
# npx will find the locally installed openapi-typescript in node_modules/.bin/
npx openapi-typescript "$OPENAPI_FILE" --output "$FULL_OUTPUT_PATH"

if [ $? -eq 0 ]; then
    echo "Successfully generated TypeScript types to '$FULL_OUTPUT_PATH'."
    echo "You can now verify the contents of '$FULL_OUTPUT_PATH'."
else
    echo "Error: 'npx openapi-typescript' failed to generate types. Please check the console output for details."
    exit 1
fi

echo "--- Script Finished ---"
