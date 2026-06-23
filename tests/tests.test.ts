import { expect, test } from "bun:test";
import { Client, Server } from "..";

test("Basic test", (done) => {
    const ClientId = "ca239de8-efa2-4705-82c4-bcda8c1e7d0c";
    const BlockId = "a6cd1913-553d-4aab-9cb8-191a93be0e90";
    let s = new Server("mqtt://localhost", 1885);

    s.on_block_meta_received((block_id, value) => {
        expect(block_id).toBe(ClientId);
        expect(value).toBe(true);
    });

    s.on_block_value_received((block_id, value) => {
        expect(value).toBe(42);
        expect(name).toBe("The answer");

        done();
    });

    let c = new Client("mqtt://localhost", 1885, ClientId);

    setTimeout(() => {
        c.send_block_value(BlockId, "The answer");
    }, 1000);
});
