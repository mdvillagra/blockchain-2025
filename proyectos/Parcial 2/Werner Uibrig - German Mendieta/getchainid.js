async function getChainId() {
  const response = await fetch('https://otter.bordel.wtf/erigon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      "jsonrpc": "2.0",
      "method": "eth_chainId",
      "params": [],
      "id": 1
    })
  });
  const data = await response.json();
  return data.result;
}

getChainId().then(console.log).catch(console.error);
