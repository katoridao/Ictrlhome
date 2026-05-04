import os
import sys
import time
import argparse
import base64
from datetime import datetime

import numpy as np
import cv2
import face_recognition
import requests

KNOWN_FACES_DIR = "known_faces"
CAMERA_INDEX = 0
FRAME_SCALE = 0.25
PROCESS_EVERY_N_FRAMES = 2
MATCH_TOLERANCE = 0.45
NOTIFY_COOLDOWN_SECONDS = 20
REGISTER_COOLDOWN_SECONDS = 5
CONFIRM_FRAMES = 3

SERVER_BASE_URL = "https://postperforated-inwrought-susy.ngrok-free.dev"
HOUSE_ID = "H001"
DEVICE_TOKEN = "CHANGE_ME_DEVICE_TOKEN"

SERVER_TIMEOUT_SECONDS = 8
JPEG_QUALITY = 70
SEND_UNKNOWN = True

SERVER_SAVE_DEVICE_TOKEN_URL = f"{SERVER_BASE_URL}/api/camera/save-device-token"
SERVER_DETECT_URL = f"{SERVER_BASE_URL}/api/camera/detect"
SERVER_FACES_EXPORT_URL = f"{SERVER_BASE_URL}/api/camera/faces/export"
SERVER_FACES_REGISTER_URL = f"{SERVER_BASE_URL}/api/camera/faces/register"


def box_iou(boxA, boxB):
    """Tính IoU giữa hai bounding box (top, right, bottom, left)."""
    topA, rightA, bottomA, leftA = boxA
    topB, rightB, bottomB, leftB = boxB

    xA = max(leftA, leftB)
    yA = max(topA, topB)
    xB = min(rightA, rightB)
    yB = min(bottomA, bottomB)

    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = (rightA - leftA) * (bottomA - topA)
    boxBArea = (rightB - leftB) * (bottomB - topB)
    if boxAArea + boxBArea == 0:
        return 0.0
    return interArea / float(boxAArea + boxBArea - interArea)


def load_known_faces(folder):
    known_encodings = []
    known_names = []

    if not os.path.exists(folder):
        os.makedirs(folder)
        print("Da tao folder known_faces. Hay them anh ten_nguoi.jpg vao day.")
        return known_encodings, known_names

    for file_name in os.listdir(folder):
        if not file_name.lower().endswith((".jpg", ".jpeg", ".png")):
            continue

        image_path = os.path.join(folder, file_name)
        image = face_recognition.load_image_file(image_path)
        encodings = face_recognition.face_encodings(image)

        if not encodings:
            print("Khong tim thay khuon mat trong:", file_name)
            continue

        person_name = os.path.splitext(file_name)[0]
        known_encodings.append(encodings[0])
        known_names.append(person_name)
        print("Da nap khuon mat:", person_name)

    return known_encodings, known_names


def frame_to_base64_jpeg(frame_bgr):
    ok, buf = cv2.imencode(".jpg", frame_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), int(JPEG_QUALITY)])
    if not ok:
        return None
    return base64.b64encode(buf.tobytes()).decode("utf-8")


def ensure_device_token_saved():
    """
    Server faces.js đang dùng 1 biến runtime (deviceFaceToken).
    Endpoint /save-device-token để set biến đó.
    """
    try:
        r = requests.post(
            SERVER_SAVE_DEVICE_TOKEN_URL,
            json={"token": DEVICE_TOKEN},
            timeout=SERVER_TIMEOUT_SECONDS,
        )
        if r.status_code != 200:
            print("Khong save DEVICE_TOKEN duoc:", r.status_code, r.text)
    except Exception as exc:
        print("Loi save DEVICE_TOKEN:", exc)


def decode_base64_image_to_rgb(image_b64: str):
    if not image_b64:
        return None

    # Neu backend/truyen ve co dang data:image/...;base64,....
    if "," in image_b64 and image_b64.strip().lower().startswith("data:"):
        image_b64 = image_b64.split(",", 1)[1].strip()

    img_bytes = base64.b64decode(image_b64)
    img_arr = np.frombuffer(img_bytes, dtype=np.uint8)
    img_bgr = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        return None
    return cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)


def export_known_faces_from_server():
    """
    Lấy danh sách face (encoding + name) của house_id từ server.
    Dùng encoding từ server trực tiếp, không re-encode lại từ ảnh.
    """
    headers = {"Authorization": f"Bearer {DEVICE_TOKEN}"}
    r = requests.get(
        SERVER_FACES_EXPORT_URL,
        params={"house_id": HOUSE_ID},
        headers=headers,
        timeout=SERVER_TIMEOUT_SECONDS,
    )
    r.raise_for_status()
    data = r.json() if r.content else {}
    faces = data.get("faces", []) or []

    known_encodings = []
    known_names = []

    for face in faces:
        name = str(face.get("name") or "").strip()
        enc_list = face.get("encoding")
        if not name:
            continue

        # Ưu tiên dùng encoding từ server (128 số)
        if isinstance(enc_list, list) and len(enc_list) == 128:
            encoding = np.array(enc_list, dtype=np.float64)
            known_encodings.append(encoding)
            known_names.append(name)
            continue

        # Fallback: decode ảnh và encode lại (cho các record cũ không có encoding)
        image_b64 = face.get("image")
        if not image_b64:
            continue
        rgb = decode_base64_image_to_rgb(image_b64)
        if rgb is None:
            continue
        h, w = rgb.shape[:2]
        encodings = face_recognition.face_encodings(
            rgb,
            known_face_locations=[(0, w, h, 0)],
            num_jitters=1,
        )
        if not encodings:
            continue
        known_encodings.append(encodings[0])
        known_names.append(name)

    return known_encodings, known_names


def register_face_to_server(name, face_crop_rgb_or_bgr, encoding_128d=None):
    image_b64 = frame_to_base64_jpeg(face_crop_rgb_or_bgr)
    if not image_b64:
        print("Khong encode duoc anh khi dang ky.")
        return False, "Khong encode duoc anh khi dang ky."

    payload = {
        "name": name,
        "image": image_b64,
        "house_id": HOUSE_ID,
    }
    # Gửi kèm encoding để server kiểm tra trùng khuôn mặt
    if encoding_128d is not None:
        payload["encoding"] = list(encoding_128d)

    headers = {"Authorization": f"Bearer {DEVICE_TOKEN}"}

    r = requests.post(
        SERVER_FACES_REGISTER_URL,
        json=payload,
        headers=headers,
        timeout=SERVER_TIMEOUT_SECONDS,
    )
    if r.status_code == 409:
        msg = "Tên đã được đăng ký."
        try:
            msg = r.json().get("message", msg)
        except Exception:
            pass
        print(f"Dang ky that bai: {msg}")
        return False, msg
    r.raise_for_status()
    return True, None


def send_detection_to_server(name, frame_bgr):
    image_b64 = frame_to_base64_jpeg(frame_bgr)
    if not image_b64:
        print("Khong encode duoc anh jpeg.")
        return

    payload = {
        "name": name,
        "image": image_b64,
        "house_id": HOUSE_ID,
        "time": datetime.now().isoformat(),
    }

    try:
        r = requests.post(SERVER_DETECT_URL, json=payload, timeout=SERVER_TIMEOUT_SECONDS)
        print("Send detect:", r.status_code, name)
    except Exception as exc:
        print("Loi gui detect len server:", exc)


def main():
    ensure_device_token_saved()

    # Ưu tiên lấy encodings từ server (cơ chế đăng ký online)
    known_encodings = []
    known_names = []
    try:
        known_encodings, known_names = export_known_faces_from_server()
        print(f"Da nap {len(known_names)} khuon mat tu server.")
    except Exception as exc:
        print("Khong lay duoc khuon mat tu server, fallback known_faces:", exc)
        known_encodings, known_names = load_known_faces(KNOWN_FACES_DIR)
        print(f"Da nap {len(known_names)} khuon mat tu folder.")

    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        print("Khong mo duoc webcam.")
        return

    print("Dang chay camera.")
    print("Nhan R de dang ky khuon mat hien tai.")
    print("Nhan Q de thoat.")
    frame_count = 0
    last_notified = {}
    registering = False
    register_name = ""
    last_register_ts = 0.0
    # IoU tracker: map face location (top,right,bottom,left) -> {name, streak, confirmed, dist, best_idx}
    face_trackers = {}

    while True:
        ret, frame = cap.read()
        if not ret:
            continue

        frame_count += 1
        if frame_count % PROCESS_EVERY_N_FRAMES != 0:
            cv2.imshow("Door Camera Recognition", frame)
            k = cv2.waitKey(1) & 0xFF
            if k == ord("q"):
                break
            if k == ord("r"):
                now = time.time()
                if now - last_register_ts >= REGISTER_COOLDOWN_SECONDS:
                    register_name = input("Nhap ten nguoi de dang ky (vd: hung): ").strip()
                    if register_name:
                        registering = True
                        last_register_ts = now
                        print("Dang ky cho:", register_name)
                    else:
                        print("Ten rong -> huy dang ky.")
            continue

        small_frame = cv2.resize(frame, (0, 0), fx=FRAME_SCALE, fy=FRAME_SCALE)
        rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

        face_locations = face_recognition.face_locations(rgb_small_frame)

        register_idx = None
        if registering and face_locations:
            areas = [(bottom - top) * (right - left) for (top, right, bottom, left) in face_locations]
            register_idx = max(range(len(areas)), key=lambda i: areas[i])

        # IoU tracking: map từng face hiện tại với tracker frame trước
        # Đồng thời cache encoding để dùng lại (tránh compute 2 lần)
        new_trackers = {}
        cached_encodings = {}  # loc tuple -> encoding numpy array
        for new_loc in face_locations:
            best_iou = 0
            best_prev_key = None
            for prev_key in list(face_trackers.keys()):
                iou = box_iou(prev_key, new_loc)
                if iou > best_iou:
                    best_iou = iou
                    best_prev_key = prev_key

            # Tính encoding + distance cho face hiện tại
            fe = face_recognition.face_encodings(rgb_small_frame, [new_loc])
            if not fe:
                continue
            fe = fe[0]
            cached_encodings[new_loc] = fe
            distances = face_recognition.face_distance(known_encodings, fe)
            best_idx = distances.argmin() if len(distances) > 0 else None
            raw_name = "Unknown"
            if best_idx is not None and distances[best_idx] <= MATCH_TOLERANCE:
                raw_name = known_names[best_idx]

            # Match cũ → tăng streak nếu tên giống, reset nếu khác
            if best_iou > 0.3 and best_prev_key is not None:
                prev_data = face_trackers[best_prev_key]
                if raw_name == prev_data["name"]:
                    streak = prev_data["streak"] + 1
                else:
                    streak = 1
                confirmed = streak >= CONFIRM_FRAMES
                new_trackers[new_loc] = {
                    "name": raw_name,
                    "streak": streak,
                    "confirmed": confirmed,
                    "best_idx": best_idx,
                    "dist": float(distances[best_idx]) if best_idx is not None else 1.0,
                }
            else:
                new_trackers[new_loc] = {
                    "name": raw_name,
                    "streak": 1,
                    "confirmed": False,
                    "best_idx": best_idx,
                    "dist": float(distances[best_idx]) if best_idx is not None else 1.0,
                }

        face_trackers = new_trackers

        for i, (top, right, bottom, left) in enumerate(face_locations):
            t_data = new_trackers.get((top, right, bottom, left))
            if not t_data:
                continue
            confirmed = t_data["confirmed"]
            name = t_data["name"] if confirmed else "Unknown"
            confidence = 1.0 - t_data["dist"] if confirmed else 0.0

            now = time.time()
            key_notify = name if confirmed else "Unknown"

            if not registering:
                can_send = key_notify not in last_notified or (now - last_notified[key_notify]) >= NOTIFY_COOLDOWN_SECONDS
                if can_send and (confirmed or SEND_UNKNOWN):
                    send_detection_to_server(key_notify, frame)
                    last_notified[key_notify] = now

            if registering and register_idx is not None and i == register_idx:
                # Lấy encoding đã cache để gửi kèm lên server
                reg_loc = face_locations[register_idx]
                enc_128d = cached_encodings.get(reg_loc)
                face_crop = rgb_small_frame[reg_loc[0]:reg_loc[2], reg_loc[3]:reg_loc[1]]
                if face_crop.size == 0:
                    print("Khong crop duoc khuon mat. Thu lai.")
                else:
                    h_s, w_s = rgb_small_frame.shape[:2]
                    top_r, right_r, bottom_r, left_r = reg_loc
                    box_h = bottom_r - top_r
                    box_w = right_r - left_r
                    pad = int(max(box_h, box_w) * 0.35)
                    t2 = max(0, top_r - pad)
                    b2 = min(h_s, bottom_r + pad)
                    l2 = max(0, left_r - pad)
                    r2 = min(w_s, right_r + pad)
                    face_crop = rgb_small_frame[t2:b2, l2:r2]

                    face_crop_bgr = cv2.cvtColor(face_crop, cv2.COLOR_RGB2BGR)
                    try:
                        ok, err = register_face_to_server(register_name, face_crop_bgr, encoding_128d=enc_128d)
                        if ok:
                            print("Da dang ky xong len server:", register_name)
                            known_encodings, known_names = export_known_faces_from_server()
                            print(f"Cap nhat {len(known_names)} khuon mat tu server.")
                        else:
                            print(f"Dang ky that bai: {err or 'Unknown error'}")
                    except Exception as exc:
                        print("Dang ky len server that bai:", exc)
                registering = False
                register_name = ""

            scale = int(1 / FRAME_SCALE)
            top *= scale
            right *= scale
            bottom *= scale
            left *= scale

            color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
            cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
            cv2.rectangle(frame, (left, bottom - 30), (right, bottom), color, cv2.FILLED)
            label = f"{name} {confidence:.2f}" if name != "Unknown" else name
            cv2.putText(frame, label, (left + 6, bottom - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

        cv2.imshow("Door Camera Recognition", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="iControlHome Face Recognition Camera")
    parser.add_argument(
        "--camera", "-c",
        type=int,
        default=0,
        help="Camera index (0 = laptop cam, 1+ = external USB cam). Dung py camera.py --camera 1",
    )
    args = parser.parse_args()

    if args.camera != 0:
        CAMERA_INDEX = args.camera
        print(f"Dung camera index = {CAMERA_INDEX} (neu can doi, truyen --camera N)")

    main()
