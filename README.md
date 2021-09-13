<p ALIGN="CENTER">
<!-- <img src="branding/midea.png" width="250px"> -->
<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="200px">
</p>

<SPAN ALIGN="CENTER">

# Homebridge HAA Downloader

[![Downloads](https://img.shields.io/npm/dt/homebridge-haa-downloader.svg?color=critical)](https://www.npmjs.com/package/homebridge-haa-downloader)
[![Version](https://img.shields.io/npm/v/homebridge-haa-downloader)](https://www.npmjs.com/package/homebridge-haa-downloader)<br>
[![Homebridge Discord](https://img.shields.io/discord/432663330281226270?color=728ED5&logo=discord&label=discord)](https://discord.gg/WE4eqqjZ)<br>

Programming is not easy.
If you like this plugin or want to contribute to future development, a donation will help. <a target="blank" href="https://www.paypal.me/hillaliy"><img src="https://img.shields.io/badge/PayPal-Donate-blue.svg?logo=paypal"/></a><br>

## [Homebridge](https://github.com/nfarina/homebridge) plugin to download HAA (Home Accessory Architect) updates.

<!-- <img src="branding/Air_Conditioner.png" width="200px"> &nbsp;
<img src="branding/Dehumidifier.jpeg" width="200px"> -->

## Requirements

<img src="https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen"> &nbsp;
<img src="https://img.shields.io/badge/homebridge-%3E%3D1.3.4-brightgreen"> &nbsp;
<img src="https://img.shields.io/badge/iOS-%3E%3D14.0.0-brightgreen">

<SPAN ALIGN="Left">

## Description

HAA - [Home Accessory Architect](https://github.com/RavenSystem/esp-homekit-devices/wiki/Home) is a native HomeKit support to any device with an ESP8266 or ESP8285 microcontroller. The project is written by José Antonio Jiménez Campos / RavenSystem.
This plugin create Occupancy sensor that alart when an HAA update is available and a swithch to pull the update files.
This plugin is for those who use custom update server.

## Configuration

Add this to the platforms array in your config.json:

       {
            "name": "HAA-Downloader",
            "interval": 1,
            "directory": "../HaaUpdates",
            "platform": "haa-downloader"
        }

## Notes

`homebridge-haa-downloader`
