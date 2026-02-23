# mapbox iOS simulator location setter

A simple web map to set locations on multiple iOS simulators by selecting the device and clicking on the location. 

Defaults to IDB, fallsback to xcrun if no IDB installed.

https://github.com/user-attachments/assets/608efa99-1cac-422d-9304-ba0617e6cfe3

## Requirements:

1. [bun](https://bun.com/docs/installation)
2. [A mapbox token](https://docs.mapbox.com/help/dive-deeper/access-tokens/)

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



