#!/bin/bash
# NexFlow Setup Script

echo "Setting up NexFlow..."

# Copy environment files
if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  echo "Created server/.env"
fi

# Install dependencies
echo "Installing server dependencies..."
cd server && npm install && cd ..

echo "Installing client dependencies..."
cd client && npm install && cd ..

# Generate Prisma client
echo "Generating Prisma client..."
cd server && npx prisma generate && cd ..

echo ""
echo "Setup complete!"
echo ""
echo "To run in development:"
echo "  1. Start PostgreSQL and Redis (or: docker-compose -f docker-compose.dev.yml up -d)"
echo "  2. cd server && npm run dev"
echo "  3. cd client && npm run dev"
echo ""
echo "To run in production:"
echo "  docker-compose up --build"
