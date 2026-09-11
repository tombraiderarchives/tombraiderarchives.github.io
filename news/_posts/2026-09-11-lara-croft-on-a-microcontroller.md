---
layout: post
title: "Lara Croft on a Microcontroller"
date: 2026-09-11
category: "Release"
tags:
  - tag: tomb-raider
header_image: "https://hackaday.com/wp-content/uploads/2026/09/Screenshot-2026-09-09-195815-2.png"
excerpt_text: "Once upon a time, you had to carefully budget your microcontroller’s resources if you wanted to do something as simple as flash a bunch of LEDs."
source_url: "https://hackaday.com/2026/09/10/lara-croft-on-a-microcontroller/"
source_rss_url: "https://news.google.com/rss/articles/CBMic0FVX3lxTE1RRTdmMWhLN0E1Wi10X2E3NFFNdGFzQmlwVGw1dkZ0eTVxYmtRV215bnhWNEhtSHVfWEs0MVBfeGNmOG55MS1qbHNxTUVmNFlzc3VkTGlMZ2hFdXpTaXdwbjQzR04tVXAwQU5MVTF4YkJhM1k?oc=5"
source_name: "Hackaday"
---

Once upon a time, you had to carefully budget your microcontroller’s resources if you wanted to do something as simple as flash a bunch of LEDs. These days, they’re powerful enough to humiliate the game consoles of yesteryear. [alexkid77] demonstrates this well, having the ESP32-P4 run Tomb Raider.

Now, [alexkid77] hasn’t gone so far as to create a PlayStation emulator on the ESP32 or anything quite like that. Instead, this is a port—and not of the original Tomb Raider release, either. [alexkid77] started with OpenLara—the classic game running in an open-source engine. With the ESP32-P4 having two cores running at 400 MHz each, there was plenty of processing power on tap to run the engine with a software renderer at 320×240, which is hardware scaled up to 1024×600 via the Pixel Processing Accelerator (PPA) built into the chip. There’s also stereo audio with an ES8311 codec hooked up, while input is via a USB HID keyboard.
