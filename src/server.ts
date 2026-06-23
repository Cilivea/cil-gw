// This server lives on the edge service, and handles the messages from the gateway services

import { connect, MqttClient } from "mqtt";
import { exec } from "mqtt-pattern";
import type {
    BlockMetaReceiveCallback,
    BlockValueReceiveCallback,
    ServerOpts,
} from "../types";
import { Value, type BlockMeta, type ValueType } from "cilivea-value";

import { getLogger } from "@logtape/logtape";

const log = getLogger(["CIL/GW", "server"]);

export class Server {
    client: MqttClient;

    value_callbacks: BlockValueReceiveCallback[] = [];
    meta_callbacks: BlockMetaReceiveCallback[] = [];
    constructor(server_host: string, server_port: number, opts?: ServerOpts) {
        this.client = connect(server_host, {
            port: server_port,
            clientId: "Server",
        });

        this.client.on("connect", () => {
            log.debug("connected server");

            this.client.subscribe("blocks/+/+/up");
        });

        this.client.on("message", (topic, payload) => {
            let block_params = exec("blocks/+id/+type/up", topic);

            if (block_params === null) return;

            if (block_params.type === "value") {
                let deserialized_value = Value.deserialize(payload.toString());
                this.value_callbacks.forEach((cb) =>
                    cb(block_params.id, deserialized_value),
                );

                return;
            } else if (block_params.type === "meta") {
                let deserialized_value = JSON.parse(payload.toString());
                this.value_callbacks.forEach((cb) =>
                    cb(block_params.id, deserialized_value),
                );
            }
        });
    }

    send_block_value(
        block_id: string,
        block_value: ValueType,
        qos: 0 | 1 | 2 = 0,
    ) {
        this.client.publish(
            `blocks/${block_id}/value/down`,
            Value.serialize(block_value),
            { qos: qos },
            () => {},
        );
    }

    on_block_value_received(fn: BlockValueReceiveCallback) {
        this.value_callbacks.push(fn);
    }

    send_block_meta(block_id: string, value: BlockMeta, qos: 0 | 1 | 2 = 0) {
        this.client.publish(
            `blocks/${block_id}/value/down`,
            JSON.stringify(value),
            { qos: qos },
            () => {},
        );
    }

    on_block_meta_received(fn: BlockMetaReceiveCallback) {
        this.meta_callbacks.push(fn);
    }
}
