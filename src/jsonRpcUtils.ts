export function payloadId(): number {
  const date = Date.now() * Math.pow(10, 3);
  const extra = Math.floor(Math.random() * Math.pow(10, 3));
  return date + extra;
}

export function formatJsonRpcRequest(
  method: string,
  params: any[],
  id?: number
): any {
  return {
    id: id || payloadId(),
    jsonrpc: "2.0",
    method,
    params,
  };
}

export function formatJsonRpcResult(
  id: number,
  result: any
): any {
  return {
    id,
    jsonrpc: "2.0",
    result,
  };
}
