# mapbox iOS simulator location setter

A simple web map to set locations on multiple iOS simulators by selecting the device and clicking on the location. 

Defaults to IDB, fallsback to xcrun if no IDB installed.

## Requirements:

[bun](https://bun.com/docs/installation)

## Install & Run:

create `.env`:
```bash  
MAP_KEY=YOUR_MAPBOX_TOKEN
```

install server/web dependencies:
```bash
bun install
```

run:
```bash
bun server.ts
```



