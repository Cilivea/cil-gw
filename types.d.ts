import type { Value, ValueType } from "cilivea-value"
export type ClientOpts = {}
export type ServerOpts = {}
export type BlockValueReceiveCallback = (gateway_id: string, block_id: string, name: string, value: ValueType) => ValueType
export type GatewayValueReceiveCallback = (gateway_id: string, name: string, value: ValueType) => ValueType
