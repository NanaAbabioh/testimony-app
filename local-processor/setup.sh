#!/bin/bash

echo "🚀 Setting up Local Video Processor"
echo "===================================="
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "✅ .env file found"
else
    echo "❌ .env file not found"
    echo "📝 Creating .env from example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your Firebase credentials"
    echo "   Run: nano .env"
    echo "   Or open in your editor and fill in the values"
    echo ""
    read -p "Press Enter after you've configured .env..."
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "=================================="
echo "✅ Setup Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Make sure .env is configured with your Firebase credentials"
echo "2. Run the processor:"
echo "   npm start          (run once)"
echo "   npm run dev        (development mode with auto-restart)"
echo ""
echo "3. To run in background:"
echo "   nohup npm start > processor.log 2>&1 &"
echo ""
echo "See README.md for more details"
echo ""
