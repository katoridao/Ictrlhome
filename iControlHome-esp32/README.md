# iControlHome ESP32 and Camera Service

This directory contains the hardware-side components of HomeCtrlApp, including the ESP32 control script and the Python-based camera and face-recognition service.

## Scope

This module covers two related parts:

- `main.py`: MicroPython script for Wi-Fi based ESP32 control
- `camera.py`: Python service for camera capture, face recognition, and backend integration

## Components

### `main.py`

The ESP32 script exposes a lightweight HTTP interface for controlling LEDs over the local network.

Supported routes include:

- `/on` and `/off`
- `/all/on` and `/all/off`
- `/led1/on`, `/led1/off`
- `/led2/on`, `/led2/off`
- `/led3/on`, `/led3/off`

The file also contains the Wi-Fi configuration and the port used by the device server.

### `camera.py`

The camera service is responsible for:

- reading frames from a local camera
- matching faces against known or exported encodings
- registering faces with the backend
- sending detection events to the API server

Important runtime settings such as `SERVER_BASE_URL`, `HOUSE_ID`, `DEVICE_TOKEN`, and `CAMERA_INDEX` are defined directly in the script.

## Requirements

Before setup, make sure the following are installed:

- Python `3.10`
- pip
- ESP32 flashing tools such as `esptool`
- camera access on the local machine

## Python environment setup

From the `iControlHome-esp32/` directory:

```powershell
py -3.10 -m venv venv
.\venv\Scripts\activate
pip install dlib-bin
pip install face-recognition --no-deps
pip install -r requirements.txt
python camera.py
```

## ESP32 flashing

Install `esptool` if needed:

```bash
pip install esptool
```

Erase and flash the firmware:

```bash
python -m esptool --port COM5 erase-flash
python -m esptool --chip esp32 --port COM5 write_flash -z 0x1000 esp32.bin
```

Replace `COM5` with the actual serial port of your ESP32 board.

## Development notes

- Use Python `3.10` for best compatibility with `dlib` and `face-recognition`.
- Update network credentials and server URLs before running on a new environment.
- Avoid committing local virtual environments, captured face data, or machine-specific settings.
- Keep backend face endpoints and device token handling consistent with the API service.
