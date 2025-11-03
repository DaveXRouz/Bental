#!/bin/bash

# Remove all console.log, console.warn, console.error, console.debug, console.info statements
# from TypeScript and JavaScript files in the project (excluding node_modules)

echo "Removing console statements from project files..."

# Find all .ts, .tsx, .js, .jsx files excluding node_modules
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -not -path "./node_modules/*" \
  -not -path "./.expo/*" \
  -not -path "./dist/*" \
  -not -path "./build/*" \
  -exec sed -i '/^[[:space:]]*console\.\(log\|warn\|error\|debug\|info\)/d' {} \;

echo "Console statements removed successfully!"
