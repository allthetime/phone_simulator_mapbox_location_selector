import Bun from "bun";

const PORT = 3131;
// server.ts
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      return new Response(Bun.file("index.html"));
    }

    if (url.pathname === "/devices") {
      const proc = Bun.spawnSync(["idb", "list-targets", "--json"]);

      console.log("idb output:", typeof proc.stdout.toString());
      // idb outputs one JSON object per line

      // {"name": "iPhone 17", "udid": "CCE29AB0-008D-45D3-920C-9298ABD2BC70", "state": "Booted", "type": "simulator", "os_version": "iOS 26.2", "architecture": "x86_64"}

      const devices = proc.stdout
        .toString()
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line))
        .filter((d) => d.state === "Booted" && d.type === "simulator");

      console.log(devices);
      return Response.json(devices);
    }

    if (url.pathname === "/location" && req.method === "POST") {
      const { udid, lat, lng } = await req.json();
      Bun.spawnSync([
        "idb",
        "set-location",
        "--udid",
        udid,
        `${lat}`,
        `${lng}`,
      ]);
      return Response.json({ ok: true });
    }

    if (url.pathname === "/mapkey" && req.method === "GET") {
      const key = process.env.MAP_KEY || "";
      return Response.json({ key });
    }

    return new Response("Not found", { status: 404 });
  },


});

console.log(`Running on http://localhost:${PORT}`);
Bun.spawnSync(["open", `http://localhost:${PORT}`]);
