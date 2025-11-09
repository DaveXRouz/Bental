#!/bin/bash

# Start standalone React DevTools
# This avoids the Chrome extension semver error with React 19.x

echo "🔧 Starting React DevTools (Standalone)..."
echo ""
echo "This will open a separate window for React DevTools."
echo "The devtools will automatically connect to your running app."
echo ""
echo "To use:"
echo "1. Keep this window open"
echo "2. Start your app with: npm run dev"
echo "3. The React DevTools window will connect automatically"
echo ""
echo "Press Ctrl+C to stop React DevTools"
echo ""

npx react-devtools
