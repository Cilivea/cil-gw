import { connect, MqttClient } from "mqtt"
import { exec } from "mqtt-pattern"

export type BlockValue = any
export type ClientOpts = {}
export type ServerOpts = {}
export type BlockValueReceiveCallback = (gateway_id: string, block_id: string, name: string, value: BlockValue) => BlockValue
export type GatewayValueReceiveCallback = (gateway_id: string, name: string, value: BlockValue) => BlockValue

export class Client {
    client: MqttClient
    id: string

    block_callbacks: BlockValueReceiveCallback[] = []
    gateway_callbacks: GatewayValueReceiveCallback[] = []
    constructor(server_host: string, server_port: number, id: string, opts?: ClientOpts) {
        this.client = connect(server_host, { port: server_port, clientId: id })
        this.id = id

        this.client.on("connect", () => {
            this.send_gateway_value("status", true)

            console.log("connected client")
            this.client.subscribe("gateway/+/blocks/+/+/down")
            this.client.subscribe("gateway/+/values/+/down")

        })

        this.client.on("message", (topic, payload) => {
            let block_params = exec("gateway/+/blocks/+id/+name/down", topic)
            if (block_params !== null) {
                let p = JSON.parse(payload.toString())
                for (let callback of this.block_callbacks) {
                    callback(this.id, block_params.id, block_params.name, p)
                }
                return
            }

            let gateway_params = exec("gateway/+/values/+name/down", topic)
            if (gateway_params !== null) {
                let p = JSON.parse(payload.toString())
                for (let callback of this.gateway_callbacks) {
                    callback(this.id, gateway_params.name, p)
                }
                return
            }
        })
    }

    send_block_value(block_id: string, value_name: string, block_value: BlockValue, qos: 0 | 1 | 2 = 0) {
        this.client.publish(`gateway/${this.id}/blocks/${block_id}/${value_name}/up`, JSON.stringify(block_value), { qos: qos }, () => { })
    }

    on_block_value_received(fn: BlockValueReceiveCallback) {
        this.block_callbacks.push(fn)
    }

    send_gateway_value(value_name: string, value: BlockValue) {
        this.client.publish(`gateway/${this.id}/values/${value_name}/up`, JSON.stringify(value))
    }

    on_gateway_value_received(fn: GatewayValueReceiveCallback) {
        this.gateway_callbacks.push(fn)
    }
}


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
            let block_params = exec("gateway/+gw/blocks/+id/+name/up", topic)
            if (block_params !== null) {
                let p = JSON.parse(payload.toString())
                for (let callback of this.block_callbacks) {
                    callback(block_params.gw, block_params.id, block_params.name, p)
                }
                return
            }

            let gateway_params = exec("gateway/+id/values/+name/up", topic)
            if (gateway_params !== null) {
                let p = JSON.parse(payload.toString())
                for (let callback of this.gateway_callbacks) {
                    callback(gateway_params.id, gateway_params.name, p)
                }
                return
            }
        })
    }

    send_block_value(gateway_id: string, block_id: string, value_name: string, block_value: BlockValue, qos: 0 | 1 | 2 = 0) {
        this.client.publish(`gateway/${gateway_id}/blocks/${block_id}/${value_name}/down`, JSON.stringify(block_value), { qos: qos }, () => { })
    }

    on_block_value_received(fn: BlockValueReceiveCallback) {
        this.block_callbacks.push(fn)
    }

    send_gateway_value(gateway_id: string, value_name: string, value: BlockValue) {
        this.client.publish(`gateway/${gateway_id}/values/${value_name}/down`, JSON.stringify(value))
    }

    on_gateway_value_received(fn: GatewayValueReceiveCallback) {
        this.gateway_callbacks.push(fn)
    }
}