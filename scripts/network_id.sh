#!/bin/bash

# Load the JSON file
json_file=".papi/polkadot-api.json"

# Extract the network names and URLs from the JSON
networks=$(jq -r '.entries | to_entries[] | "\(.key) \(.value.wsUrl)"' $json_file)

# Loop through each network and fetch the genesis hash
echo "Fetching genesis hashes for all networks..."
while read -r network wsUrl; do
  # Replace "wss://" with "https://" to match the curl format
  httpUrl=$(echo $wsUrl | sed 's/wss:\/\//https:\/\//')

  echo -n "$network: "
  # Fetch the genesis hash and remove the '0x' prefix
  curl -s -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0", "method":"chain_getBlockHash", "params":[0], "id":1}' \
    $httpUrl | jq -r '.result' | sed 's/^0x//'
done <<< "$networks"
