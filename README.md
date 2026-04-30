# GazePoint Playback Plugin

A Playback plugin for [**Multimodal Observer**](https://github.com/MultimodalObserver-2/mo), designed to visualize pupil diameter recordings from a Gazepoint GP3 device synchronized with the session timeline.

## Features

- **Waveform visualization** of pupil diameter over time, synchronized with the session timeline
- **Seek and pause support** through the session controls
- **Zoom controls** to adjust amplitude and time scale of the waveform
- **Preview** identifying the plugin in the interface

## Supported Formats

- `.txt`
- `.raw`

The plugin accepts files produced by the [GazePoint Capture Plugin](https://github.com/MultimodalObserver-2/mo-plugin-capture-gazepoint).

## ⚙️ Configuration Options

This plugin has no configurable properties.

## How It Works

- Reads the recording file and extracts timestamped pupil diameter samples (`lps` field).
- Normalizes timestamps relative to the start of the recording.
- Renders the waveform as a canvas drawing that updates as the session plays back.

## 📦 Installation

1. Download the latest plugin release from [here](https://github.com/MultimodalObserver-2/mo-plugin-playback-gazepoint/releases/latest).
2. Extract the downloaded `.zip` file.
3. Register the plugin using the plugin interface within Multimodal Observer.
