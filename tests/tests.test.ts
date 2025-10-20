import { expect, test } from "bun:test"
import { Client, Server } from ".."

test("Basic test", (done) => {
    const ClientId = "ca239de8-efa2-4705-82c4-bcda8c1e7d0c"
    const BlockId = "a6cd1913-553d-4aab-9cb8-191a93be0e90"
    let s = new Server("mqtt://localhost", 1884)

    s.on_gateway_value_received((gw_id, name, value) => {
        expect(gw_id).toBe(ClientId)
        expect(name).toBe("status")
        expect(value).toBe(true)
    })

    s.on_block_value_received((gw_id, bk_id, name, value) => {
        expect(value).toBe(42)
        expect(gw_id).toBe(ClientId)
        expect(bk_id).toBe(BlockId)
        expect(name).toBe("The answer")

        done()
    })

    let c = new Client("mqtt://localhost", 1884, ClientId)
    setTimeout(() => {
        c.send_block_value(BlockId, "The answer", 42, 1)
    }, 1000)


})