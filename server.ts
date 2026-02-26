
import Bun from "bun";
const PORT = 3131;

const hasIdb = Bun.spawnSync(["which", "idb"]).exitCode === 0;
const hasAdb = Bun.spawnSync(["which", "adb"]).exitCode === 0;
console.log(hasIdb ? "Using idb" : "idb not found, falling back to xcrun simctl");
console.log(hasAdb ? "adb found, will include Android emulators" : "adb not found, skipping Android emulators");

function getDevices() {
  let devices: any[] = [];

  // iOS simulators
  if (hasIdb) {
    const proc = Bun.spawnSync(["idb", "list-targets", "--json"]);
    devices = proc.stdout.toString()
      .trim()
      .split("\n")
      .map(line => JSON.parse(line))
      .filter(d => d.state === "Booted" && d.type === "simulator");
  } else {
    const proc = Bun.spawnSync(["xcrun", "simctl", "list", "devices", "booted", "--json"]);
    const output = JSON.parse(proc.stdout.toString());
    devices = Object.values(output.devices)
      .flat()
      .filter((d: any) => d.state === "Booted")
      .map((d: any) => ({ name: d.name, udid: d.udid, state: d.state, type: "simulator" }));
  }

  // Android emulators
  if (hasAdb) {
    // Get list of running emulator IDs
    const proc = Bun.spawnSync(["adb", "devices"]);
    const lines = proc.stdout.toString().split("\n").slice(1);
    const emulatorIds = lines
      .map(line => line.trim().split(/\s+/))
      .filter(parts => parts.length === 2 && parts[0].startsWith("emulator-") && parts[1] === "device")
      .map(parts => parts[0]);

    // Try to get emulator names for each running emulator
    for (const emulatorId of emulatorIds) {
      let name = emulatorId;
      try {
        // Try to get the AVD name via adb emu avd name
        const nameProc = Bun.spawnSync(["adb", "-s", emulatorId, "emu", "avd", "name"]);
        const avdName = nameProc.stdout.toString().trim();
        if (avdName) {
          name = avdName;
        }
      } catch (e) {
        // fallback to emulatorId
      }
      devices.push({ name, udid: emulatorId, state: "Booted", type: "android" });
    }
  }

  return devices;
}

function setLocation(udid: string, lat: number, lng: number) {
  if (udid.startsWith("emulator-") && hasAdb) {
    // Android emulator expects longitude first, then latitude
    Bun.spawnSync(["adb", "-s", udid, "emu", "geo", "fix", `${lng}`, `${lat}`]);
  } else if (hasIdb) {
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