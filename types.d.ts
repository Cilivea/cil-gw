export type BlockValue = any
export type ClientOpts = {}
export type ServerOpts = {}
export type BlockValueReceiveCallback = (gateway_id: string, block_id: string, name: string, value: BlockValue) => BlockValue
export type GatewayValueReceiveCallback = (gateway_id: string, name: string, value: BlockValue) => BlockValue
