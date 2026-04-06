# iControlHome ESP32 and Camera Service

This folder contains the hardware-side pieces of the project:

- `main.py` → MicroPython HTTP control script for ESP32
- `camera.py` → Python camera + face-recognition service

Together, these scripts let the smart-home backend control an ESP32 over Wi-Fi and receive camera / face-detection events.

## `main.py` (ESP32 control)

The ESP32 script starts a small HTTP server on the board and exposes routes such as:

- `/on` and `/off`
- `/all/on` and `/all/off`
- `/led1/on`, `/led1/off`
- `/led2/on`, `/led2/off`
- `/led3/on`, `/led3/off`

Before uploading `main.py`, update these values in the file:

- `SSID`
- `PWD`
- `PORT`

> Make sure the ESP32 and backend / mobile app are on the **same Wi-Fi network**.

## `camera.py` (camera recognition service)

The camera service is responsible for:

- reading frames from a webcam
- matching faces with saved or exported encodings
- registering new faces with the backend
- sending detection events to the API server

Before running `camera.py`, review and update:

- `SERVER_BASE_URL`
- `HOUSE_ID`
- `DEVICE_TOKEN`
- `CAMERA_INDEX`

## Requirements

Install the following first:

- Python `3.10` recommended
- pip
- a working webcam
- ESP32 board with MicroPython support
- `esptool` or another flashing/upload tool

## Python setup for camera service

From the `iControlHome-esp32/` directory:

```powershell
py -3.10 -m venv venv
.\venv\Scripts\activate
pip install dlib-bin
pip install face-recognition --no-deps
pip install -r requirements.txt
python camera.py
```

If the face-recognition stack is difficult to install on your machine, use a Python `3.10` environment first for the best compatibility.

## Upload / flash ESP32 script

If needed, install `esptool`:

```bash
pip install esptool
```

Typical flashing flow:

```bash
python -m esptool --port COM5 erase-flash
python -m esptool --chip esp32 --port COM5 write_flash -z 0x1000 esp32.bin
```

Replace `COM5` with the actual serial port of your ESP32.

If you use **MicroPico**, **Thonny**, or another IDE that can upload files directly, you can simply send `main.py` to the board after editing the Wi-Fi credentials.

## Runtime checklist

Before testing the full system, confirm that:

1. backend API is already running
2. ESP32 has connected to Wi-Fi and printed its IP address
3. `camera.py` can reach the backend URL
4. the IP stored in the backend device record matches the ESP32 IP

## Security note

Do not commit:

- real Wi-Fi passwords
- local tokens
- captured face data you do not want to share
- local venv / cache files

The folder already ignores common secret and temporary file patterns, but always double-check before pushing to git.

---

# README tiếng Việt

## Thư mục này gồm những gì?

Phần này là phía phần cứng / camera của dự án, gồm 2 file chính:

- `main.py` → code MicroPython chạy trên ESP32 để bật / tắt thiết bị qua HTTP
- `camera.py` → script Python dùng webcam để nhận diện khuôn mặt và gửi dữ liệu về backend

Hiểu đơn giản thì đây là phần giúp backend “nói chuyện” được với ESP32 và camera thật ngoài đời.

## `main.py` dùng để làm gì?

File này chạy trên ESP32 và mở ra một HTTP server nhỏ. Từ đó backend hoặc app có thể gọi các đường dẫn như:

- `/on`, `/off`
- `/all/on`, `/all/off`
- `/led1/on`, `/led1/off`
- `/led2/on`, `/led2/off`
- `/led3/on`, `/led3/off`

Trước khi nạp file vào board, nhớ sửa lại:

- `SSID`
- `PWD`
- `PORT`

> Quan trọng: ESP32 nên cùng mạng Wi‑Fi với backend / app để việc điều khiển ổn định hơn.

## `camera.py` đang làm gì?

Script này phụ trách:

- đọc hình từ webcam
- so khớp khuôn mặt đã lưu
- gửi sự kiện nhận diện về backend
- hỗ trợ đăng ký thêm khuôn mặt mới

Trước khi chạy thì nên kiểm tra các biến như:

- `SERVER_BASE_URL`
- `HOUSE_ID`
- `DEVICE_TOKEN`
- `CAMERA_INDEX`

## Cần cài gì trước?

- Python `3.10` là đẹp nhất
- pip
- webcam hoạt động ổn
- ESP32 có MicroPython
- `esptool` hoặc công cụ upload code như MicroPico / Thonny

## Chạy camera service nhanh

Trong thư mục `iControlHome-esp32/`:

```powershell
py -3.10 -m venv venv
.\venv\Scripts\activate
pip install dlib-bin
pip install face-recognition --no-deps
pip install -r requirements.txt
python camera.py
```

Nếu gặp lỗi cài `face-recognition` thì cứ ưu tiên Python `3.10` trước, thường sẽ đỡ vất vả hơn khá nhiều.

## Flash / upload ESP32

Nếu cần dùng `esptool`:

```bash
pip install esptool
python -m esptool --port COM5 erase-flash
python -m esptool --chip esp32 --port COM5 write_flash -z 0x1000 esp32.bin
```

Đổi `COM5` thành đúng cổng COM của board cậu đang dùng.

Nếu cậu dùng **MicroPico** hay **Thonny** thì thường chỉ cần sửa file xong rồi upload `main.py` lên board là đủ.

## Checklist trước khi test cả hệ thống

1. backend đã chạy
2. ESP32 đã kết nối Wi‑Fi và in ra IP
3. `camera.py` gọi được về backend
4. IP lưu trong thiết bị ở database đúng với IP thật của ESP32

## Ghi chú bảo mật

Không nên commit:

- mật khẩu Wi‑Fi thật
- token local
- dữ liệu khuôn mặt riêng tư
- `venv`, cache hay file tạm

Repo đã ignore phần lớn các file kiểu này rồi, nhưng trước khi push vẫn nên check lại cho yên tâm.
