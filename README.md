# Proto-Town Public Website

A static landing page for [Proto-Town, USA](https://www.proto.town/) featuring a live broadcast feed with a retro-industrial terminal aesthetic.

## Overview

The site presents a single-page "Desert Channel" — a live video feed from Proto-Town rendered in a CRT-style broadcast window. Think early NASA mission control meets rural Texas hardware workshop.

## Stack

- **Pure HTML + CSS + vanilla JS** — no frameworks, no build step
- **Cloudflare Stream** for live video embed
- **GitHub Pages** for hosting

## Local Development

Open `index.html` in a browser, or serve locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deployment

The site is deployed via GitHub Pages from the `main` branch root.

## Livestream

The live video feed is served via Cloudflare Stream. The RTMP ingest pipeline is:

```
Camera/OBS → RTMP push → Cloudflare Stream → iframe embed
```
