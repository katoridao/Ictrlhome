# iControlHome ESP32 and Camera Service

## Overview

The `iControlHome-esp32/` directory contains the project's hardware and camera components, including two main files:

- `main.py` → MicroPython program that runs on the ESP32 to control devices over HTTP
- `camera.py` → Python service that uses a webcam for facial recognition and sends data to the backend

These components connect the software system to the physical devices.

## `main.py` Features

`main.py` runs on the ESP32 and starts a simple HTTP server. The backend or application can call paths such as:

- `/on`, `/off`
- `/all/on`, `/all/off`
- `/led1/on`, `/led1/off`
- `/led2/on`, `/led2/off`
- `/led3/on`, `/led3/off`

Before flashing the code to the board, update the following values directly in `main.py`:

- `SSID`
- `PWD`
- `PORT`

> The ESP32 should use the same Wi-Fi network as the backend and mobile app to ensure a stable connection.

## `camera.py` Features

`camera.py` is responsible for:

- Reading frames from the webcam
- Matching faces against saved data
- Sending recognition events to the backend
- Supporting registration of new faces

Before running it, edit the following values near the top of `camera.py`:

- `SERVER_BASE_URL`
- `HOUSE_ID`
- `DEVICE_TOKEN`
- `CAMERA_INDEX`

## Requirements

- Python `3.10` is recommended
- `pip`
- A working webcam
- An ESP32 board that supports MicroPython
- `esptool` or an upload tool such as MicroPico / Thonny

## Quick Start: Camera Service

From the `iControlHome-esp32/` directory, run:

```powershell
py -3.10 -m venv venv
.\venv\Scripts\activate
pip install dlib-bin
pip install face-recognition --no-deps
pip install -r requirements.txt
python camera.py
```

To change the backend URL, camera token, or ESP32 Wi-Fi settings, update `camera.py` and `main.py` directly.

If you have trouble installing `face-recognition`, use Python `3.10` for better compatibility.

## Flashing / Uploading to the ESP32

To use `esptool`, run:

```bash
pip install esptool
python -m esptool --port COM5 erase-flash
python -m esptool --chip esp32 --port COM5 write-flash -z 0x1000 esp32.bin
```

Replace `COM5` with the serial port used by your device.

If using **MicroPico** or **Thonny**, edit `main.py` directly and upload it to the board.

## Full-System Testing Checklist

1. The backend is running.
2. The ESP32 is connected to Wi-Fi and displays its IP address.
3. `camera.py` can connect to the backend.
4. The IP address stored in the database matches the ESP32's actual IP address.

## Configuration Notes

Values such as Wi-Fi settings, the backend URL, and the camera token are currently configured directly in the source code for convenience during demos and testing.

When changing environments, update `main.py` and `camera.py` accordingly.
