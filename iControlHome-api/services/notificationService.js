const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const Notification = require("../models/Notification");
const House = require("../models/House");
const User = require("../models/User");
const Device = require("../models/Device");

const DEFAULT_NOTIFICATION_SETTINGS = Object.freeze({
  enabled: true,
  new_member: true,
  permission_granted: true,
  device_status: true,
  automation_triggered: true,
  camera_detected: true,
  device_offline: true,
});

let firebaseWarningShown = false;
let deviceMonitorTimer = null;

const mergeNotificationSettings = (settings = {}) => ({
  ...DEFAULT_NOTIFICATION_SETTINGS,
  ...(settings || {}),
});

const normalizeLanguage = (language = "VI") =>
  String(language || "VI").toUpperCase() === "EN" ? "EN" : "VI";

const isStatusOn = (status) => {
  if (typeof status === "boolean") return status;
  return String(status || "").toUpperCase() === "ON";
};

const getLocalizedNotificationContent = ({
  language = "VI",
  localizationKey,
  fallbackTitle,
  fallbackMessage,
  data = {},
}) => {
  const safeLanguage = normalizeLanguage(language);
  const statusOn = isStatusOn(data.status);
  const safeDeviceName = data.device_name || "";
  const safeAutomationName = data.automation_name || "";
  const safeMemberName =
    data.member_name ||
    (safeLanguage === "EN" ? "A new member" : "Một thành viên mới");
  const safePersonName =
    data.person_name || (safeLanguage === "EN" ? "Unknown person" : "Người lạ");

  switch (localizationKey) {
    case "new_member":
      return safeLanguage === "EN"
        ? {
            title: "A new member joined your house",
            message: [
              `Member: ${safeMemberName}`,
              data.member_phone ? `Phone: ${data.member_phone}` : null,
            ]
              .filter(Boolean)
              .join("\n"),
          }
        : {
            title: "Có thành viên mới gia nhập nhà",
            message: [
              `Thành viên: ${safeMemberName}`,
              data.member_phone ? `SĐT: ${data.member_phone}` : null,
            ]
              .filter(Boolean)
              .join("\n"),
          };

    case "permission_granted": {
      const scopeLabel = safeDeviceName
        ? safeLanguage === "EN"
          ? `device ${safeDeviceName}`
          : `thiết bị ${safeDeviceName}`
        : data.room_name
          ? safeLanguage === "EN"
            ? `room ${data.room_name}`
            : `phòng ${data.room_name}`
          : safeLanguage === "EN"
            ? "your home system"
            : "hệ thống nhà";

      const actorName =
        data.actor_name || (safeLanguage === "EN" ? "The admin" : "Admin");

      return safeLanguage === "EN"
        ? {
            title: "Access granted to you",
            message: [`Granted by: ${actorName}`, `Scope: ${scopeLabel}`].join(
              "\n",
            ),
          }
        : {
            title: "Bạn vừa được cấp quyền sử dụng",
            message: [
              `Người cấp quyền: ${actorName}`,
              `Phạm vi: ${scopeLabel}`,
            ].join("\n"),
          };
    }

    case "device_status": {
      const actorName =
        data.actor_name ||
        (safeLanguage === "EN" ? "A member" : "Một thành viên");

      return safeLanguage === "EN"
        ? {
            title: `Device ${statusOn ? "turned on" : "turned off"}`,
            message: [
              `Device: ${safeDeviceName || "Unknown"}`,
              `By: ${actorName}`,
              `Status: ${statusOn ? "ON" : "OFF"}`,
            ].join("\n"),
          }
        : {
            title: `Thiết bị vừa được ${statusOn ? "bật" : "tắt"}`,
            message: [
              `Thiết bị: ${safeDeviceName || "Không xác định"}`,
              `Người thao tác: ${actorName}`,
              `Trạng thái: ${statusOn ? "BẬT" : "TẮT"}`,
            ].join("\n"),
          };
    }

    case "automation_triggered": {
      const actorName =
        data.actor_name || (safeLanguage === "EN" ? "System" : "Hệ thống");

      return safeLanguage === "EN"
        ? {
            title: "Automation was triggered",
            message: [
              `Automation: ${safeAutomationName || "Unnamed automation"}`,
              `Set by: ${actorName}`,
              `Device: ${safeDeviceName || "The device"}`,
              `Action: ${statusOn ? "TURN ON" : "TURN OFF"}`,
            ].join("\n"),
          }
        : {
            title: "Automation vừa được kích hoạt",
            message: [
              `Automation: ${safeAutomationName || "Chưa đặt tên"}`,
              `Người thiết lập: ${actorName}`,
              `Thiết bị: ${safeDeviceName || "Thiết bị"}`,
              `Hành động: ${statusOn ? "BẬT" : "TẮT"}`,
            ].join("\n"),
          };
    }

    case "camera_detected":
      if (safeLanguage === "EN") {
        return data.detected_status === "known"
          ? {
              title: "The camera detected someone",
              message: [
                `Detected person: ${safePersonName}`,
                "Status: Recognized",
              ].join("\n"),
            }
          : {
              title: "The camera detected an unknown person",
              message: [
                "Detected person: Unknown",
                "Status: Needs attention",
              ].join("\n"),
            };
      }

      return data.detected_status === "known"
        ? {
            title: "Camera vừa phát hiện người xuất hiện",
            message: [
              `Đối tượng: ${safePersonName}`,
              "Trạng thái: Đã nhận diện",
            ].join("\n"),
          }
        : {
            title: "Camera vừa phát hiện người lạ",
            message: [
              "Đối tượng: Người lạ",
              "Trạng thái: Cần kiểm tra ngay",
            ].join("\n"),
          };

    case "device_offline":
      return safeLanguage === "EN"
        ? {
            title: "A device is offline",
            message: [
              `Device: ${safeDeviceName || "Unknown"}`,
              "Status: OFFLINE",
            ].join("\n"),
          }
        : {
            title: "Thiết bị đang offline",
            message: [
              `Thiết bị: ${safeDeviceName || "Không xác định"}`,
              "Trạng thái: OFFLINE",
            ].join("\n"),
          };

    default:
      return {
        title:
          fallbackTitle ||
          (safeLanguage === "EN" ? "Notification" : "Thông báo"),
        message:
          fallbackMessage ||
          (safeLanguage === "EN"
            ? "You have a new notification from your smart home system."
            : "Bạn có một thông báo mới từ hệ thống nhà thông minh."),
      };
  }
};

const getNotificationContentForUser = (user, payload = {}) => {
  const localizationKey =
    payload.localizationKey ||
    payload.settingsKey ||
    getSettingsKeyFromType(payload.type, payload.settingsKey);
  const language = normalizeLanguage(user?.settings?.language);

  const localizedContent = getLocalizedNotificationContent({
    language,
    localizationKey,
    fallbackTitle: payload.title,
    fallbackMessage: payload.message,
    data: payload.data || {},
  });

  return {
    language,
    localizationKey,
    title: localizedContent.title,
    message: localizedContent.message,
    data: {
      ...(payload.data || {}),
      language,
      localization_key: localizationKey,
      title: localizedContent.title,
      body: localizedContent.message,
    },
  };
};

const getSettingsKeyFromType = (type, fallbackKey) => {
  if (fallbackKey) return fallbackKey;

  switch (type) {
    case "MEMBER":
      return "new_member";
    case "PERMISSION":
      return "permission_granted";
    case "DEVICE":
      return "device_status";
    case "AUTOMATION":
      return "automation_triggered";
    case "CAMERA":
      return "camera_detected";
    case "SYSTEM":
    default:
      return "device_offline";
  }
};

const resolveServiceAccountPath = () => {
  const explicitPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const backendRoot = path.join(__dirname, "..");

  const autoDetectedFile = fs
    .readdirSync(backendRoot)
    .find((fileName) => /firebase-adminsdk.*\.json$/i.test(fileName));

  const candidates = [
    explicitPath,
    autoDetectedFile ? path.join(backendRoot, autoDetectedFile) : null,
  ].filter(Boolean);

  return candidates.find((candidatePath) => {
    const resolvedPath = path.isAbsolute(candidatePath)
      ? candidatePath
      : path.resolve(candidatePath);
    return fs.existsSync(resolvedPath);
  });
};

const ensureFirebaseAdmin = () => {
  if (admin.apps.length > 0) return true;

  try {
    const jsonFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const serviceAccountPath = resolveServiceAccountPath();

    if (jsonFromEnv) {
      const serviceAccount = JSON.parse(jsonFromEnv);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log(
        "[Notification] Firebase Admin đã được khởi tạo từ JSON env.",
      );
      return true;
    }

    if (serviceAccountPath) {
      const resolvedPath = path.isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : path.resolve(serviceAccountPath);

      const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log(
        `[Notification] Firebase Admin đã được khởi tạo từ file ${path.basename(resolvedPath)}.`,
      );
      return true;
    }

    if (!firebaseWarningShown) {
      firebaseWarningShown = true;
      console.warn(
        "[Notification] Chưa cấu hình FIREBASE_SERVICE_ACCOUNT_JSON hoặc FIREBASE_SERVICE_ACCOUNT_PATH. Hệ thống vẫn lưu notification vào DB nhưng chưa đẩy FCM.",
      );
    }

    return false;
  } catch (error) {
    console.error(
      "[Notification] Không thể khởi tạo Firebase Admin:",
      error.message,
    );
    return false;
  }
};

const stringifyPushData = (data = {}) => {
  return Object.entries(data).reduce((acc, [key, value]) => {
    acc[key] = value == null ? "" : String(value);
    return acc;
  }, {});
};

const isNotificationEnabledForUser = (user, settingsKey) => {
  const mergedSettings = mergeNotificationSettings(user?.notification_settings);

  if (!mergedSettings.enabled) return false;
  if (!settingsKey) return true;

  return mergedSettings[settingsKey] !== false;
};

const getHouseRecipients = async (houseId = "H001") => {
  const house = await House.findById(houseId)
    .populate("owner_id")
    .populate("members");

  if (!house) return [];

  const recipients = new Map();

  if (house.owner_id?._id) {
    recipients.set(house.owner_id._id.toString(), house.owner_id);
  }

  for (const member of house.members || []) {
    if (member?._id) {
      recipients.set(member._id.toString(), member);
    }
  }

  return Array.from(recipients.values());
};

const removeInvalidTokens = async (invalidEntries = []) => {
  if (!invalidEntries.length) return;

  const tokensByUser = invalidEntries.reduce((acc, entry) => {
    const userId = entry.userId?.toString();
    if (!userId) return acc;
    if (!acc[userId]) acc[userId] = [];
    acc[userId].push(entry.token);
    return acc;
  }, {});

  await Promise.all(
    Object.entries(tokensByUser).map(([userId, tokens]) =>
      User.findByIdAndUpdate(userId, {
        $pull: { fcm_tokens: { $in: tokens } },
      }),
    ),
  );
};

const sendPushToUsers = async (users = [], payload = {}) => {
  const groupedTargets = new Map();

  for (const user of users) {
    const tokens = [...new Set((user?.fcm_tokens || []).filter(Boolean))];
    if (!tokens.length) continue;

    const localized = getNotificationContentForUser(user, payload);
    const groupKey = [
      localized.language,
      localized.localizationKey,
      localized.title,
      localized.message,
    ].join("::");

    if (!groupedTargets.has(groupKey)) {
      groupedTargets.set(groupKey, {
        localized,
        entries: [],
      });
    }

    const group = groupedTargets.get(groupKey);
    for (const token of tokens) {
      group.entries.push({ userId: user._id, token });
    }
  }

  const allEntries = Array.from(groupedTargets.values()).flatMap(
    (group) => group.entries,
  );

  if (!allEntries.length) {
    return { successCount: 0, failureCount: 0, skipped: true };
  }

  if (!ensureFirebaseAdmin()) {
    return { successCount: 0, failureCount: 0, skipped: true };
  }

  const invalidEntries = [];
  let successCount = 0;
  let failureCount = 0;

  for (const group of groupedTargets.values()) {
    const multicastMessage = {
      tokens: group.entries.map((entry) => entry.token),
      notification: {
        title: group.localized.title,
        body: group.localized.message,
      },
      data: stringifyPushData({
        type: payload.type || "SYSTEM",
        house_id: payload.houseId || "H001",
        ...group.localized.data,
      }),
      android: {
        priority: "high",
        notification: {
          channelId: "ictrlhome-default",
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    };

    try {
      const result = await admin
        .messaging()
        .sendEachForMulticast(multicastMessage);

      successCount += result.successCount;
      failureCount += result.failureCount;

      result.responses.forEach((response, index) => {
        if (response.success) return;
        const code = response.error?.code || "";
        if (
          code.includes("registration-token-not-registered") ||
          code.includes("invalid-registration-token")
        ) {
          invalidEntries.push(group.entries[index]);
        }
      });
    } catch (error) {
      console.error("[Notification] Lỗi gửi FCM:", error.message);
      failureCount += group.entries.length;
    }
  }

  await removeInvalidTokens(invalidEntries);

  return {
    successCount,
    failureCount,
    skipped: false,
  };
};

const emitRealtimeNotification = ({
  houseId,
  users,
  title,
  message,
  type,
  data,
}) => {
  if (!global.io) return;

  global.io.to(String(houseId || "H001")).emit("notification_created", {
    title,
    message,
    type,
    data: data || {},
    house_id: String(houseId || "H001"),
    user_ids: users.map((user) => user._id.toString()),
    created_at: new Date().toISOString(),
  });
};

const notifyUsers = async ({
  users = [],
  excludeUserId,
  excludedUserIds = [],
  houseId = "H001",
  title,
  message,
  type = "SYSTEM",
  settingsKey,
  localizationKey,
  data = {},
}) => {
  try {
    const effectiveSettingsKey =
      localizationKey || getSettingsKeyFromType(type, settingsKey);
    const excludedSet = new Set(
      [excludeUserId, ...(excludedUserIds || [])]
        .filter(Boolean)
        .map((id) => id.toString()),
    );

    const eligibleUsers = users.filter(
      (user) =>
        user?._id &&
        !excludedSet.has(user._id.toString()) &&
        isNotificationEnabledForUser(user, effectiveSettingsKey),
    );

    if (!eligibleUsers.length) {
      return { stored: 0, pushed: 0, skipped: true };
    }

    const effectiveData = {
      ...(data || {}),
      localization_key: effectiveSettingsKey,
    };

    const deliveries = eligibleUsers.map((user) => ({
      user,
      localized: getNotificationContentForUser(user, {
        houseId,
        title,
        message,
        type,
        settingsKey: effectiveSettingsKey,
        localizationKey: effectiveSettingsKey,
        data: effectiveData,
      }),
    }));

    await Notification.insertMany(
      deliveries.map(({ user, localized }) => ({
        user_id: user._id,
        house_id: houseId,
        title: localized.title,
        message: localized.message,
        type,
        data: localized.data,
        is_read: false,
        created_at: new Date(),
      })),
      { ordered: false },
    );

    emitRealtimeNotification({
      houseId,
      users: eligibleUsers,
      title,
      message,
      type,
      data: effectiveData,
    });

    const pushResult = await sendPushToUsers(eligibleUsers, {
      houseId,
      title,
      message,
      type,
      settingsKey: effectiveSettingsKey,
      localizationKey: effectiveSettingsKey,
      data: effectiveData,
    });

    return {
      stored: eligibleUsers.length,
      pushed: pushResult.successCount || 0,
      skipped: false,
    };
  } catch (error) {
    console.error("[Notification] Lỗi notifyUsers:", error.message);
    return { stored: 0, pushed: 0, skipped: false };
  }
};

const notifyHouseUsers = async (payload) => {
  const houseId = payload.houseId || "H001";
  const recipients = await getHouseRecipients(houseId);
  return notifyUsers({ ...payload, houseId, users: recipients });
};

const createNotification = async (userId, msg, overrides = {}) => {
  if (!userId) return { stored: 0, pushed: 0, skipped: true };

  const user = await User.findById(userId);
  if (!user) return { stored: 0, pushed: 0, skipped: true };

  return notifyUsers({
    users: [user],
    houseId: overrides.houseId || "H001",
    title: overrides.title || "Thông báo",
    message: msg,
    type: overrides.type || "SYSTEM",
    settingsKey: overrides.settingsKey,
    data: overrides.data || {},
  });
};

const notifyNewMemberJoined = async ({
  houseId = "H001",
  memberName,
  memberPhone,
  actorUserId,
}) => {
  const house = await House.findById(houseId).populate("owner_id");
  if (!house?.owner_id) return;

  const safeName = memberName || memberPhone || "Một thành viên mới";

  await notifyUsers({
    users: [house.owner_id],
    excludeUserId: actorUserId,
    houseId,
    title: "Có thành viên mới gia nhập nhà",
    message: `${safeName} vừa tham gia vào nhà của bạn.`,
    type: "MEMBER",
    settingsKey: "new_member",
    data: {
      member_name: safeName,
      member_phone: memberPhone || "",
      target_screen: "ManageMembers",
    },
  });
};

const notifyPermissionGranted = async ({
  houseId = "H001",
  memberId,
  actorName,
  actorUserId,
  deviceName,
  roomName,
  canControl = true,
}) => {
  if (!memberId || !canControl) return;

  const user = await User.findById(memberId);
  if (!user) return;

  const scopeLabel = deviceName
    ? `thiết bị ${deviceName}`
    : roomName
      ? `phòng ${roomName}`
      : "hệ thống nhà";

  await notifyUsers({
    users: [user],
    excludeUserId: actorUserId,
    houseId,
    title: "Bạn vừa được cấp quyền sử dụng",
    message: `${actorName || "Admin"} đã cấp quyền điều khiển ${scopeLabel} cho bạn.`,
    type: "PERMISSION",
    settingsKey: "permission_granted",
    data: {
      actor_name: actorName || "Admin",
      device_name: deviceName || "",
      room_name: roomName || "",
      target_screen: "Main",
    },
  });
};

const notifyDeviceStatusChanged = async ({
  houseId = "H001",
  deviceName,
  deviceId,
  status,
  actorName,
  actorUserId,
}) => {
  const actionLabel = status ? "bật" : "tắt";

  await notifyHouseUsers({
    houseId,
    excludeUserId: actorUserId,
    title: `Thiết bị vừa được ${actionLabel}`,
    message: `${actorName || "Một thành viên"} đã ${actionLabel} thiết bị ${deviceName}.`,
    type: "DEVICE",
    settingsKey: "device_status",
    data: {
      device_name: deviceName || "",
      device_id: deviceId?.toString() || "",
      status: status ? "ON" : "OFF",
      actor_name: actorName || "",
      target_screen: "DeviceLogScreen",
    },
  });
};

const notifyAutomationTriggered = async ({
  houseId = "H001",
  automationName,
  deviceName,
  deviceId,
  status,
  actorName,
  actorUserId,
}) => {
  const safeActorName = actorName || "Hệ thống";
  const actionLabel = status ? "bật" : "tắt";

  await notifyHouseUsers({
    houseId,
    title: "Automation vừa được kích hoạt",
    message: `Automation "${automationName || "Chưa đặt tên"}" do ${safeActorName} thiết lập vừa ${actionLabel} ${deviceName || "thiết bị"}.`,
    type: "AUTOMATION",
    settingsKey: "automation_triggered",
    data: {
      automation_name: automationName || "",
      device_name: deviceName || "",
      device_id: deviceId?.toString() || "",
      status: status ? "ON" : "OFF",
      actor_name: safeActorName,
      target_screen: "DeviceLogScreen",
    },
  });
};

const notifyCameraDetection = async ({
  houseId = "H001",
  personName,
  isKnown,
}) => {
  const safeName =
    personName && personName !== "Unknown" ? personName : "Người lạ";

  await notifyHouseUsers({
    houseId,
    title: "Camera vừa phát hiện người xuất hiện",
    message: isKnown
      ? `${safeName} vừa xuất hiện trước camera.`
      : "Camera vừa phát hiện người lạ trước cửa.",
    type: "CAMERA",
    settingsKey: "camera_detected",
    data: {
      person_name: safeName,
      detected_status: isKnown ? "known" : "unknown",
      target_screen: "EntryExitScreen",
    },
  });
};

const notifyDeviceOffline = async ({
  houseId = "H001",
  deviceName,
  deviceId,
}) => {
  await notifyHouseUsers({
    houseId,

    type: "SYSTEM",
    settingsKey: "device_offline",
    data: {
      device_name: deviceName || "",
      device_id: deviceId?.toString() || "",
      connectivity_status: "OFFLINE",
      target_screen: "DeviceLogScreen",
    },
  });
};

const buildDevicePingUrl = (hostOrIp) => {
  const raw = String(hostOrIp || "").trim();
  if (!raw) return null;
  return raw.startsWith("http://") || raw.startsWith("https://")
    ? raw
    : `http://${raw}`;
};

const pingDevice = async (hostOrIp, timeoutMs = 5000) => {
  const url = buildDevicePingUrl(hostOrIp);
  if (!url) return { online: false, reason: "missing_url" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    return {
      online: true,
      status: response.status,
    };
  } catch (error) {
    return {
      online: false,
      reason: error?.message || "unknown_error",
    };
  } finally {
    clearTimeout(timer);
  }
};

const initDeviceStatusMonitor = () => {
  if (deviceMonitorTimer) return;

  deviceMonitorTimer = setInterval(async () => {
    try {
      const devices = await Device.find({
        esp32_ip: { $exists: true, $nin: [null, ""] },
      });

      for (const device of devices) {
        const probe = await pingDevice(device.esp32_ip);
        const nextStatus = probe.online ? "ONLINE" : "OFFLINE";
        const previousStatus = device.connectivity_status || "UNKNOWN";

        const update = {
          connectivity_status: nextStatus,
        };

        if (probe.online) {
          update.last_seen_at = new Date();
        }

        await Device.findByIdAndUpdate(device._id, update);

        if (previousStatus !== nextStatus && global.io) {
          global.io
            .to(String(device.house_id || "H001"))
            .emit("device_connectivity_changed", {
              device_id: device._id.toString(),
              house_id: device.house_id || "H001",
              connectivity_status: nextStatus,
              last_seen_at: update.last_seen_at || device.last_seen_at || null,
            });
        }

        if (previousStatus !== "OFFLINE" && nextStatus === "OFFLINE") {
          await notifyDeviceOffline({
            houseId: device.house_id || "H001",
            deviceName: device.name,
            deviceId: device._id,
          });
        }
      }
    } catch (error) {
      console.error("[Notification] Lỗi monitor thiết bị:", error.message);
    }
  }, 60 * 1000);

  console.log("[Notification] Device connectivity monitor started");
};

module.exports = {
  DEFAULT_NOTIFICATION_SETTINGS,
  mergeNotificationSettings,
  createNotification,
  notifyUsers,
  notifyHouseUsers,
  notifyNewMemberJoined,
  notifyPermissionGranted,
  notifyDeviceStatusChanged,
  notifyAutomationTriggered,
  notifyCameraDetection,
  notifyDeviceOffline,
  initDeviceStatusMonitor,
  ensureFirebaseAdmin,
};
