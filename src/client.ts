import { connect, MqttClient } from "mqtt"
import { exec } from "mqtt-pattern"
import type { BlockValueReceiveCallback, ClientOpts, GatewayValueReceiveCallback } from "../types"
import { Value, type ValueType } from "cilivea-value"

export class Client {
    client: MqttClient
    id: string

    block_callbacks: BlockValueReceiveCallback[] = []
    gateway_callbacks: GatewayValueReceiveCallback[] = []
    constructor(server_host: string, server_port: number, id: string, opts?: ClientOpts) {
        this.id = id
        this.client = connect(server_host, {
            port: server_port, clientId: id, will: {
                topic: `gateway/${this.id}/values/status`,
                payload: "false",
                qos: 2,
            }
        })

        this.client.on("connect", () => {
            this.send_gateway_value("status", true)

            console.log("connected client")
            this.client.subscribe("gateway/+/blocks/+/+/down")
            this.client.subscribe("gateway/+/values/+/down")

        })

        this.client.on("message", (topic, payload) => {
            let deserialized_value = Value.deserialize(payload.toString())

            let block_params = exec("gateway/+/blocks/+id/+name/down", topic)
            if (block_params !== null) {
                this.block_callbacks.forEach(cb =>
                    cb(this.id, block_params.id, block_params.name, deserialized_value)
                )
                return
            }

            let gateway_params = exec("gateway/+/values/+name/down", topic)
            if (gateway_params !== null) {
                this.gateway_callbacks.forEach(cb =>
                    cb(this.id, gateway_params.name, deserialized_value)
                )
                return
            }
        })
    }

    send_block_value(block_id: string, value_name: string, block_value: ValueType, qos: 0 | 1 | 2 = 0) {
        this.client.publish(`gateway/${this.id}/blocks/${block_id}/${value_name}/up`, Value.serialize(block_value), { qos: qos }, () => { })
    }

    on_block_value_received(fn: BlockValueReceiveCallback) {
        this.block_callbacks.push(fn)
    }

    send_gateway_value(value_name: string, value: ValueType) {
        this.client.publish(`gateway/${this.id}/values/${value_name}/up`, Value.serialize(value))
    }

    on_gateway_value_received(fn: GatewayValueReceiveCallback) {
        this.gateway_callbacks.push(fn)
    }
}