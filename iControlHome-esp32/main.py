import time
time.sleep(3)

import network
import socket
import machine
import gc
from machine import Pin

# ===== CONFIG =====
SSID = "4evauni"
PWD = "0niichansuki"
PORT = 8080

# ===== LED =====
led_main = Pin(2, Pin.OUT)

leds = {
    "led1": Pin(21, Pin.OUT),
    "led2": Pin(22, Pin.OUT),
    "led3": Pin(23, Pin.OUT)
}

for led in leds.values():
    led.off()

# ===== HTTP RESPONSE =====
RESP_OK = b"HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nOK"
RESP_404 = b"HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nNOT_FOUND"

# ===== WIFI =====
def wifi_connect():
    wlan = network.WLAN(network.STA_IF)

    try:
        wlan.disconnect()
    except:
        pass

    wlan.active(True)

    try:
        wlan.config(pm=0xA11140)
    except:
        pass

    if not wlan.isconnected():
        wlan.connect(SSID, PWD)

        t0 = time.ticks_ms()
        while not wlan.isconnected():
            if time.ticks_diff(time.ticks_ms(), t0) > 15000:
                machine.reset()
            time.sleep_ms(300)

    return wlan


# ===== HANDLE REQUEST =====
def handle_request(req):
    try:
        line = req.split(b"\r\n")[0]

        # ===== MAIN LED =====
        if line.startswith(b"GET /on"):
            led_main.on()
            return True

        if line.startswith(b"GET /off"):
            led_main.off()
            return True

        # ===== ALL LED =====
        if line.startswith(b"GET /all/on"):
            for led in leds.values():
                led.on()
            return True

        if line.startswith(b"GET /all/off"):
            for led in leds.values():
                led.off()
            return True

        # ===== INDIVIDUAL LED =====
        for name in leds:
            name_b = name.encode()

            if line.startswith(b"GET /" + name_b + b"/on"):
                leds[name].on()
                return True

            if line.startswith(b"GET /" + name_b + b"/off"):
                leds[name].off()
                return True

    except:
        pass

    return False


# ===== START =====
wifi = wifi_connect()
print("Connected:", wifi.ifconfig())

addr = socket.getaddrinfo("0.0.0.0", PORT)[0][-1]
s = socket.socket()

try:
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
except:
    pass

s.bind(addr)
s.listen(2)

# tránh block accept
s.settimeout(2)

print("Server running on port", PORT)


# ===== MAIN LOOP =====
while True:
    cl = None
    try:
        try:
            cl, addr = s.accept()
        except:
            time.sleep_ms(50)
            continue

        cl.settimeout(2)

        try:
            req = cl.recv(512)
        except:
            time.sleep_ms(20)
            continue

        if not req:
            continue

        if handle_request(req):
            cl.sendall(RESP_OK)
        else:
            cl.sendall(RESP_404)

    except:
        pass

    finally:
        if cl:
            try:
                cl.close()
            except:
                pass

        gc.collect()
        time.sleep_ms(20)