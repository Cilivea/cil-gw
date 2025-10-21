import { connect, MqttClient } from "mqtt"
import { exec } from "mqtt-pattern"
import type { BlockValueReceiveCallback, GatewayValueReceiveCallback, ServerOpts } from "../types"
import { Value, type ValueType } from "cilivea-value"


export class Server {
    client: MqttClient

    block_callbacks: BlockValueReceiveCallback[] = []
    gateway_callbacks: GatewayValueReceiveCallback[] = []
    constructor(server_host: string, server_port: number, opts?: ServerOpts) {

        this.client = connect(server_host, { port: server_port, clientId: "Server" })

        this.client.on("connect", () => {
            console.log("connected server")
            this.client.subscribe("gateway/+/blocks/+/+/up")
            this.client.subscribe("gateway/+/values/+/up")
        })

        this.client.on("message", (topic, payload) => {
            let p = Value.deserialize(payload.toString())
            let block_params = exec("gateway/+gw/blocks/+id/+name/up", topic)
            if (block_params !== null) {
                for (let callback of this.block_callbacks) {
                    callback(block_params.gw, block_params.id, block_params.name, p)
                }
                return
            }

            let gateway_params = exec("gateway/+id/values/+name/up", topic)
            if (gateway_params !== null) {
                for (let callback of this.gateway_callbacks) {
                    callback(gateway_params.id, gateway_params.name, p)
                }
                return
            }
        })
    }

    send_block_value(gateway_id: string, block_id: string, value_name: string, block_value: ValueType, qos: 0 | 1 | 2 = 0) {
        this.client.publish(`gateway/${gateway_id}/blocks/${block_id}/${value_name}/down`, Value.serialize(block_value), { qos: qos }, () => { })
    }

    on_block_value_received(fn: BlockValueReceiveCallback) {
        this.block_callbacks.push(fn)
    }

    send_gateway_value(gateway_id: string, value_name: string, value: ValueType) {
        this.client.publish(`gateway/${gateway_id}/values/${value_name}/down`, Value.serialize(value))
    }

    on_gateway_value_received(fn: GatewayValueReceiveCallback) {
        this.gateway_callbacks.push(fn)
    }
}