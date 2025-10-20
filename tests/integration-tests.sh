#!/usr/bin/env bash

shut_down_containers(){
  echo "Shutting down containerized database..."
  docker-compose --file ./tests/docker-compose.yml down -v
  echo "Containerized database shut down"
}

echo "Starting postgres database within docker container..."

# Detached so the tests can run in our terminal. 
docker-compose --file ./tests/docker-compose.yml up -d

# But now we have to wait for the docker-compose to finish.
./tests/wait-until.sh "docker-compose --file ./tests/docker-compose.yml exec -T db psql -d test -U postgres -c  'SELECT 1'" 10

# Check status code of previous script/command. If docker-compose failed, exit.
if [[ $? -ne 0 ]]; then
  shut_down_containers
  echo "Exiting integration-tests.sh..."
  exit 1
fi

# If docker-compose up successfully started the containers, continue.
echo "Containerized database is ready"
echo "Migrating prisma schema to database..."

npx prisma migrate dev

# If prisma migrate failed for any reason, exit.
if [[ $? -ne 0 ]]; then
  shut_down_containers
  echo "Exiting integration-tests.sh..."
  exit 1
fi

echo "Migration complete"
echo "Running vitest..."

# Vitest will watch for changes until the terminal process is exited. 
# Filepath not relative to script dir, but package dir, since script will be launched from package.json.
vitest --config vitest.int.config.js

echo "Vitest finished"

shut_down_containers
