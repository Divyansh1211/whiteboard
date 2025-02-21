import { createClient } from "redis";

const client = createClient();

client.on("error", (error) => {
  console.error(error);
});

await client.connect();

export async function get(key: string) {
  return await client.get(key);
}

export async function set(key: string, value: string) {
  return await client.set(key, value);
}

export async function del(key: string) {
  return await client.del(key);
}
