# Qantas Virtual

Qantas Virtual is a standalone virtual-airline site. The offline edition is plain HTML, CSS, and vanilla JavaScript, so it does not require the React app, a database, or a hosted backend.

## Where the offline site is located

The main file is:

- [`Testing/index.html`](Testing/index.html)

The `Testing/` folder on GitHub is available at:

- <https://github.com/lllons/Qantas-Virtual/tree/main/Testing>

The six saved route files in that folder are local launchers that open the matching section of `Testing/index.html`:

| File ending | Opens |
| --- | --- |
| `8：31：58 AM.html` | Fleet |
| `8：32：15 AM.html` | Live board |
| `8：32：23 AM.html` | Events |
| `8：32：30 AM.html` | Crew |
| `8：32：39 AM.html` | Team |
| `8：32：48 AM.html` | Home |

## Quick start

### Option 1: Open the file directly

1. Clone or download the repository.
2. Open the repository's `Testing/index.html` file in a web browser.
3. Use the navigation buttons to move between Home, Routes, Fleet, Live, Events, Crew, Team, and Pilot Hub.

No package installation is required for the offline site.

From a terminal, the file can be opened with:

```bash
# macOS
open Testing/index.html

# Linux
xdg-open Testing/index.html

# Windows PowerShell
Start-Process Testing/index.html
```

### Option 2: Serve the folder locally

A local web server is useful when testing it as a website:

```bash
cd Testing
python3 -m http.server 8080
```

Then visit <http://localhost:8080> in a browser. Stop the server with `Ctrl+C`.

## Offline behavior

- Navigation, route filtering, modals, bookings, event registrations, theme switching, and cancellation actions run in the browser.
- Local bookings and registrations are stored in that browser's `localStorage`; they are not sent to a server.
- Aviation photos are loaded from Unsplash when internet access is available. If the images cannot load, the built-in gradient artwork remains visible.
- The site contains no dependency on the original hosted application.
