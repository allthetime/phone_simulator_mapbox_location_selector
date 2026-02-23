import Bun from "bun";
const PORT = 3131;

const hasIdb = Bun.spawnSync(["which", "idb"]).exitCode === 0;
console.log(hasIdb ? "Using idb" : "idb not found, falling back to xcrun simctl");

function getDevices() {
  if (hasIdb) {
    const proc = Bun.spawnSync(["idb", "list-targets", "--json"]);
    return proc.stdout.toString()
      .trim()
      .split("\n")
      .map(line => JSON.parse(line))
      .filter(d => d.state === "Booted" && d.type === "simulator");
  } else {
    const proc = Bun.spawnSync(["xcrun", "simctl", "list", "devices", "booted", "--json"]);
    const output = JSON.parse(proc.stdout.toString());
    return Object.values(output.devices)
      .flat()
      .filter((d: any) => d.state === "Booted")
      .map((d: any) => ({ name: d.name, udid: d.udid, state: d.state, type: "simulator" }));
  }
}

function setLocation(udid: string, lat: number, lng: number) {
  if (hasIdb) {
    Bun.spawnSync(["idb", "set-location", "--udid", udid, `${lat}`, `${lng}`]);
  } else {
    Bun.spawnSync(["xcrun", "simctl", "location", udid, "set", `${lat},${lng}`]);
  }
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      return new Response(Bun.file("index.html"));
    }

    if (url.pathname === "/devices") {
      const devices = getDevices();
      console.log(devices);
      return Response.json(devices);
    }

    if (url.pathname === "/location" && req.method === "POST") {
      const { udid, lat, lng } = await req.json();
      setLocation(udid, lat, lng);
      return Response.json({ ok: true });
    }


    if (url.pathname === "/mapkey" && req.method === "GET") {
      const key = process.env.MAP_KEY || "";
      return Response.json({ key });
    }

    return new Response("Not found", { status: 404 });
  }
});

console.log(`Running on http://localhost:${PORT}`);
Bun.spawnSync(["open", `http://localhost:${PORT}`]);