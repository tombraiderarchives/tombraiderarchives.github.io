---
layout: post
title: "Tomb Raider Can Run on an ESP32-P4"
date: 2026-09-14
category: "News"
tags:
  - tag: tomb-raider
  - tag: free-to-play
header_image: "https://korben.info/tomb-raider-peut-tourner-sur-un-esp32-p4/tomb-raider-peut-tourner-sur-un-esp32-p4-1.webp"
excerpt_text: "Tomb Raider now runs on a development board equipped with an ESP32-P4, a microcontroller designed to drive electronic devices."
source_url: "https://korben.info/en/tomb-raider-esp32-p4.html"
source_rss_url: "https://news.google.com/rss/articles/CBMiXEFVX3lxTE8wT0MxYXdRU29KSGdNWTBQbDhjWjIyTkxTOW1LcHppVFkzNm84QXNnTnZDb2NlVGRmQkhhdEloUThWU0xESU1EWHBuZUp6bE1WNE5XTDM5TGhPQ3Bm?oc=5"
source_name: "Korben"
---

Tomb Raider now runs on a development board equipped with an ESP32-P4, a microcontroller designed to drive electronic devices. Developer Alejandro Villegas Alonso, known as alexkid77, adapted OpenLara to it, the free engine that lets the original game run with its own data.

No PlayStation emulator here. The program doesn't try to reproduce the full workings of the console: it runs a version of the engine adapted to this chip, with image rendering handled by the processor. The work therefore focuses on the game itself and how it uses the available resources.

The board used is called the ESP32-P4-Function-EV-Board. The documented configuration has two cores running at 400 MHz, 16 MB of flash memory to store the program, and 32 MB of external working memory. You'll need this hardware, or some serious adaptation work - not just any old ESP32 pulled out of a forgotten drawer.

The image is rendered at 320 x 240 pixels, then scaled up to fill a 1,024 x 600 pixel screen. This second step uses the PPA, the pixel-processing accelerator built into the chip, which avoids forcing the engine to draw the entire scene at screen resolution.

The repository claims 30 frames per second. The result is pretty impressive for a board that wasn't designed to be a living-room console.

The port also supports sound, saves to a microSD card, and a frames-per-second counter that can be displayed with F12. A USB keyboard is required to play: the arrow keys handle movement, and the space bar makes you jump.

To set up the board, the developer says to use ESP-IDF, Espressif's development environment, version 5.4 or newer. You need to compile the project, then flash the program onto the microcontroller. So this download is mainly aimed at people who already enjoy tinkering with hardware.

The game files must be added separately in a data folder on the microSD card. OpenLara provides the engine, not the levels and assets of the commercial Tomb Raider, and the port won't work without this data. The documentation also notes that saves and the cache are written to this card.

Personally, I love these projects that give old engines a whole new playground.
