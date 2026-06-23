import type { BlockMeta, ValueType } from "cilivea-value";
export type ClientOpts = {
    will?: {};
};
export type ServerOpts = {};

export type BlockValueReceiveCallback = (
    block_id: string,
    value: ValueType,
) => void;

export type BlockMetaReceiveCallback = (
    block_id: string,
    value: BlockMeta,
) => void;
