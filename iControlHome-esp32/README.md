# iControlHome ESP32 and Camera Service

## Tổng quan

Thư mục `iControlHome-esp32/` chứa các thành phần liên quan tới phần cứng và camera của dự án, gồm hai tệp chính:

- `main.py` → chương trình MicroPython chạy trên ESP32 để điều khiển thiết bị qua HTTP
- `camera.py` → dịch vụ Python sử dụng webcam để nhận diện khuôn mặt và gửi dữ liệu về backend

Thành phần này đóng vai trò kết nối giữa hệ thống phần mềm và thiết bị thực tế.

## Chức năng của `main.py`

`main.py` chạy trên ESP32 và mở một HTTP server đơn giản. Backend hoặc ứng dụng có thể gọi các đường dẫn như:

- `/on`, `/off`
- `/all/on`, `/all/off`
- `/led1/on`, `/led1/off`
- `/led2/on`, `/led2/off`
- `/led3/on`, `/led3/off`

Trước khi nạp code lên board, cập nhật trực tiếp trong `main.py` các giá trị sau:

- `SSID`
- `PWD`
- `PORT`

> ESP32 nên sử dụng cùng mạng Wi‑Fi với backend và ứng dụng mobile để bảo đảm độ ổn định của kết nối.

## Chức năng của `camera.py`

`camera.py` chịu trách nhiệm:

- đọc khung hình từ webcam
- so khớp khuôn mặt đã lưu
- gửi sự kiện nhận diện về backend
- hỗ trợ đăng ký thêm khuôn mặt mới

Trước khi chạy, cần chỉnh trực tiếp ở đầu file `camera.py` các giá trị sau:

- `SERVER_BASE_URL`
- `HOUSE_ID`
- `DEVICE_TOKEN`
- `CAMERA_INDEX`

## Yêu cầu môi trường

- Python `3.10` được khuyến nghị
- `pip`
- webcam hoạt động ổn định
- ESP32 có hỗ trợ MicroPython
- `esptool` hoặc công cụ upload như MicroPico / Thonny

## Khởi động nhanh camera service

Trong thư mục `iControlHome-esp32/`, thực hiện:

```powershell
py -3.10 -m venv venv
.\venv\Scripts\activate
pip install dlib-bin
pip install face-recognition --no-deps
pip install -r requirements.txt
python camera.py
```

Khi cần thay đổi URL backend, token camera hoặc Wi‑Fi ESP32, cập nhật trực tiếp trong `camera.py` và `main.py`.

Nếu gặp khó khăn khi cài `face-recognition`, nên ưu tiên sử dụng Python `3.10` để tăng khả năng tương thích.

## Flash / upload ESP32

Khi cần dùng `esptool`, có thể thực hiện:

```bash
pip install esptool
python -m esptool --port COM5 erase-flash
python -m esptool --chip esp32 --port COM5 write-flash -z 0x1000 esp32.bin
```

Trong đó, `COM5` cần được thay bằng đúng cổng serial của thiết bị đang sử dụng.

Nếu sử dụng **MicroPico** hoặc **Thonny**, chỉ cần chỉnh trực tiếp `main.py` rồi upload lên board.

## Checklist trước khi kiểm thử toàn hệ thống

1. backend đã được khởi động
2. ESP32 đã kết nối Wi‑Fi và hiển thị IP
3. `camera.py` có thể kết nối tới backend
4. IP lưu trong database khớp với IP thực tế của ESP32

## Ghi chú cấu hình

Các giá trị như Wi‑Fi, URL backend và token camera hiện được chỉnh trực tiếp trong mã nguồn để thuận tiện cho việc demo và kiểm thử.

Khi thay đổi môi trường chạy, chỉ cần cập nhật lại `main.py` và `camera.py`.
