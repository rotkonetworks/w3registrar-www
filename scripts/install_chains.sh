networks=("polkadot" "westend2" "ksmcc3")
parachains=("asset_hub" "bridge_hub" "collectives" "encointer" "people")

for network in "${networks[@]}"; do
  for parachain in "${parachains[@]}"; do
    echo "Processing $network $parachain"
    network_id="${network}_${parachain}"
    command="bunx papi add ${network_id} -n ${network_id}"
    echo \$ $command
    $command
    echo 
  done
done
