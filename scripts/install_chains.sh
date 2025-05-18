networks=("polkadot" "westend2" "ksmcc3" "paseo")
parachains=("asset_hub" "people")

add_chain() {
  local network=$1
  local parachain=$2
  if [ -z "$parachain" ]; then
    local network_id="$network"
  else 
    local network_id="${network}_${parachain}"
  fi
  echo "installing $network $parachain"
  command="bunx papi add ${network_id} -n ${network_id} --skip-codegen"
  echo \$ $command
  $command
}

codegen() {
  command="bunx papi generate"
  echo "Generating code for installed chains' metadata"
  echo \$ $command
  $command
}

for network in "${networks[@]}"; do
  add_chain "$network"
  for parachain in "${parachains[@]}"; do
    add_chain "$network" "$parachain"
  done
done
codegen
