#!/bin/bash

# Stop script on any error
set -ex

# Function to clean up temporary directory and return to the original directory
cleanup() {
    echo "Cleaning up..."
    popd >/dev/null 2>&1 || true  # Return to the original directory, if possible
    rm -rf "$temp_dir"  # Remove the temporary directory
    echo "Cleaned up temporary directory."
}

# Ensure cleanup is done on exit, error, or script interruption (like Ctrl+C)
trap cleanup EXIT

# Enforce VITE_APP_* environment variables to be present
required_vars=("VITE_APP_WALLET_CONNECT_PROJECT_ID" "VITE_APP_DEFAULT_WS_URL")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: Required environment variable $var is not set."
        exit 1
    fi
done

app_dir=$(pwd)

# Create a temporary directory and navigate into it
temp_dir=$(mktemp -d)
echo "Created temporary directory: $temp_dir"
pushd "$temp_dir" >/dev/null

# Copy the package.json and pnpm-lock.yaml into the App directory
cp -r ${app_dir}/.* ${app_dir}/* .

# Install pnpm globally
npm install pnpm vite polkadot-api serve

# Add polkadot people, kusama, westend, and paseo using `papi`
npx papi add -n polkadot_people polkadot
npx papi add -n ksmcc3_people kusama
npx papi add -n westend2_people westend
npx papi add -n paseo paseo

# Install the project dependencies
pnpm install

# Build the project using Vite
npx vite build

# Serve the project (can be commented out if necessary)
# pnpm add serve
#npx serve --single dist

cp -r dist ${app_dir}
ls -Al ${app_dir}/dist

# Done
echo "Build completed successfully."

# Returning to the original directory and cleaning up is automatically handled by the trap
