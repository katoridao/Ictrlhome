const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const Notification = require("../models/Notification");
const House = require("../models/House");
const User = require("../models/User");
const Device = require("../models/Device");
const DeviceUsage = require("../models/DeviceUsage");

const DEFAULT_NOTIFICATION_SETTINGS = Object.freeze({
  enabled: true,
  new_member: true,
  permission_granted: true,
  device_status: true,
  automation_triggered: true,
  camera_detected: true,
  consumption_estimate: true,
});

let firebaseWarningShown = false;
let deviceMonitorTimer = null;
let consumptionMonitorTimer = null;

const ESTIMATED_COST_ALERT_THRESHOLDS = Object.freeze([
  { vnd: 30, level: "NOTICE" },
  { vnd: 50, level: "NORMAL_HIGH" },
  { vnd: 80, level: "HIGH" },
  { vnd: 120, level: "VERY_HIGH" },
]);

const mergeNotificationSettings = (...sources) => {
  const merged = { ...DEFAULT_NOTIFICATION_SETTINGS };

  for (const settings of sources) {
    if (!settings) continue;

    for (const key of Object.keys(DEFAULT_NOTIFICATION_SETTINGS)) {
      if (typeof settings[key] === "boolean") {
        merged[key] = settings[key];
      }
    }
  }

  return merged;
};

const extractUserNotificationSettings = (user) =>
  mergeNotificationSettings(
    user?.settings?.notification,
    user?.notification_settings,
  );

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
  const safeOwnerName =
    data.owner_name || (safeLanguage === "EN" ? "the home owner" : "chủ nhà");

  switch (localizationKey) {
    case "new_member":
      return safeLanguage === "EN"
        ? {
            title: "A new member joined your house",
            message: `${safeMemberName} joined your family.`,
          }
        : {
            title: "Có thành viên mới gia nhập nhà",
            message: `${safeMemberName} đã gia nhập gia đình của bạn.`,
          };

    case "member_added_to_household":
      return safeLanguage === "EN"
        ? {
            title: "Family updated",
            message: `${safeOwnerName} added ${safeMemberName} to the household.`,
          }
        : {
            title: "Cập nhật hộ gia đình",
            message: `${safeOwnerName} đã thêm ${safeMemberName} vào hộ gia đình.`,
          };

    case "member_self_joined":
      return safeLanguage === "EN"
        ? {
            title: "Joined house successfully",
            message: `You joined ${safeOwnerName}'s house successfully.`,
          }
        : {
            title: "Tham gia nhà thành công",
            message: `Bạn đã gia nhập nhà của ${safeOwnerName} thành công.`,
          };

    case "member_added_by_owner":
      return safeLanguage === "EN"
        ? {
            title: "You were added to a house",
            message: `You were added to ${safeOwnerName}'s house.`,
          }
        : {
            title: "Bạn đã được thêm vào hộ gia đình",
            message: `Bạn đã được ${safeOwnerName} thêm vào hộ gia đình.`,
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

    case "estimated_cost_threshold":
    case "consumption_estimate_threshold": {
      const safeThreshold = Number(data.threshold_vnd || 0);
      const safeTotal = Number(data.total_cost_vnd || 0);
      const safeMonthLabel = data.month_label || "";

      return safeLanguage === "EN"
        ? {
            title: "Estimated electricity cost reached a new level",
            message: [
              safeMonthLabel
                ? `Month: ${safeMonthLabel}`
                : "Month: Current month",
              `Reached threshold: ${Math.round(safeThreshold).toLocaleString("en-US")} VND`,
              `Current estimate: ${Math.round(safeTotal).toLocaleString("en-US")} VND`,
            ].join("\n"),
          }
        : {
            title: "Chi phí điện ước tính đã đạt ngưỡng mới",
            message: [
              safeMonthLabel
                ? `Tháng: ${safeMonthLabel}`
                : "Tháng: Tháng hiện tại",
              `Ngưỡng vừa đạt: ${Math.round(safeThreshold).toLocaleString("vi-VN")} VNĐ`,
              `Ước tính hiện tại: ${Math.round(safeTotal).toLocaleString("vi-VN")} VNĐ`,
            ].join("\n"),
          };
    }

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
      return null;
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

const filterUserPushTokens = (tokens = [], excludeTokens = []) => {
  const excludedSet =
    excludeTokens instanceof Set
      ? excludeTokens
      : new Set((excludeTokens || []).filter(Boolean).map(String));

  return [...new Set((tokens || []).filter(Boolean).map(String))].filter(
    (token) => !excludedSet.has(token),
  );
};

const isNotificationEnabledForUser = (user, settingsKey) => {
  const mergedSettings = extractUserNotificationSettings(user);

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
  const excludedTokensSet = new Set(
    (payload.excludeTokens || []).filter(Boolean).map(String),
  );

  for (const user of users) {
    const tokens = filterUserPushTokens(
      user?.fcm_tokens || [],
      excludedTokensSet,
    );
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
  excludeTokens = [],
  houseId = "H001",
  title,
  message,
  type = "SYSTEM",
  settingsKey,
  localizationKey,
  data = {},
}) => {
  try {
    const effectiveSettingsKey = settingsKey || getSettingsKeyFromType(type);
    const effectiveLocalizationKey = localizationKey || effectiveSettingsKey;
    const excludedSet = new Set(
      [excludeUserId, ...(excludedUserIds || [])]
        .filter(Boolean)
        .map((id) => id.toString()),
    );

    const uniqueUsers = Array.from(
      new Map(
        (users || [])
          .filter((user) => user?._id)
          .map((user) => [user._id.toString(), user]),
      ).values(),
    );

    const eligibleUsers = uniqueUsers.filter(
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
      localization_key: effectiveLocalizationKey,
    };

    const deliveries = eligibleUsers.map((user) => ({
      user,
      localized: getNotificationContentForUser(user, {
        houseId,
        title,
        message,
        type,
        settingsKey: effectiveSettingsKey,
        localizationKey: effectiveLocalizationKey,
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

    const realtimeSample = deliveries[0]?.localized || {};

    emitRealtimeNotification({
      houseId,
      users: eligibleUsers,
      title: realtimeSample.title || title || "Thông báo",
      message: realtimeSample.message || message || "",
      type,
      data: effectiveData,
    });

    const pushResult = await sendPushToUsers(eligibleUsers, {
      houseId,
      title,
      message,
      type,
      settingsKey: effectiveSettingsKey,
      localizationKey: effectiveLocalizationKey,
      data: effectiveData,
      excludeTokens,
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
  memberId,
  memberName,
  memberPhone,
  actorUserId,
  addedByOwner = false,
}) => {
  const house = await House.findById(houseId)
    .populate("owner_id")
    .populate("members");
  if (!house?.owner_id) return;

  const safeName = memberName || memberPhone || "Một thành viên mới";
  const ownerName = house.owner_id.name || house.owner_id.phone || "chủ nhà";
  const joinedUserId = memberId?.toString() || actorUserId?.toString() || null;
  const ownerId = house.owner_id?._id?.toString?.() || null;
  const memberRecipients = (house.members || []).filter(Boolean);

  if (addedByOwner) {
    const existingFamilyRecipients = memberRecipients.filter((user) => {
      const userId = user?._id?.toString?.();
      return userId && userId !== joinedUserId && userId !== ownerId;
    });

    await notifyUsers({
      users: existingFamilyRecipients,
      houseId,
      title: "Cập nhật hộ gia đình",
      message: `${ownerName} đã thêm ${safeName} vào hộ gia đình.`,
      type: "MEMBER",
      settingsKey: "new_member",
      localizationKey: "member_added_to_household",
      data: {
        member_name: safeName,
        member_phone: memberPhone || "",
        owner_name: ownerName,
        actor_user_id: actorUserId?.toString() || "",
        target_screen: "ManageMembers",
      },
    });
  } else {
    const existingFamilyRecipients = [
      house.owner_id,
      ...memberRecipients,
    ].filter((user) => user?._id?.toString?.() !== joinedUserId);

    await notifyUsers({
      users: existingFamilyRecipients,
      houseId,
      title: "Có thành viên mới gia nhập nhà",
      message: `${safeName} đã gia nhập gia đình của bạn.`,
      type: "MEMBER",
      settingsKey: "new_member",
      localizationKey: "new_member",
      data: {
        member_name: safeName,
        member_phone: memberPhone || "",
        owner_name: ownerName,
        target_screen: "ManageMembers",
      },
    });
  }

  if (!joinedUserId) return;

  const joinedUser =
    memberRecipients.find((user) => user?._id?.toString?.() === joinedUserId) ||
    (await User.findById(joinedUserId));

  if (!joinedUser) return;

  await notifyUsers({
    users: [joinedUser],
    houseId,
    title: addedByOwner
      ? "Bạn đã được thêm vào hộ gia đình"
      : "Tham gia nhà thành công",
    message: addedByOwner
      ? `Bạn đã được ${ownerName} thêm vào hộ gia đình.`
      : `Bạn đã gia nhập nhà của ${ownerName} thành công.`,
    type: "MEMBER",
    settingsKey: "new_member",
    localizationKey: addedByOwner
      ? "member_added_by_owner"
      : "member_self_joined",
    data: {
      member_name: safeName,
      member_phone: memberPhone || "",
      owner_name: ownerName,
      actor_user_id: actorUserId?.toString() || "",
      target_screen: "Main",
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

  const house = await House.findById(houseId);
  const isHouseMember = house
    ? house.owner_id?.toString() === memberId.toString() ||
      (house.members || []).some(
        (member) => member.toString() === memberId.toString(),
      )
    : false;

  if (!isHouseMember) return;

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
  actorDeviceToken,
}) => {
  const actionLabel = status ? "bật" : "tắt";

  await notifyHouseUsers({
    houseId,
    excludeTokens: actorDeviceToken ? [actorDeviceToken] : [],
    title: `Thiết bị vừa được ${actionLabel}`,
    message: `${actorName || "Một thành viên"} đã ${actionLabel} thiết bị ${deviceName}.`,
    type: "DEVICE",
    settingsKey: "device_status",
    data: {
      device_name: deviceName || "",
      device_id: deviceId?.toString() || "",
      status: status ? "ON" : "OFF",
      actor_name: actorName || "",
      actor_user_id: actorUserId?.toString() || "",
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

const calculateUsageOverlapSeconds = ({
  usageStart,
  usageEnd,
  rangeStart,
  rangeEnd,
}) => {
  const startMs = Math.max(
    new Date(usageStart).getTime(),
    new Date(rangeStart).getTime(),
  );
  const endMs = Math.min(
    new Date(usageEnd).getTime(),
    new Date(rangeEnd).getTime(),
  );

  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    endMs <= startMs
  ) {
    return 0;
  }

  return Math.floor((endMs - startMs) / 1000);
};

const buildCurrentMonthRange = (now = new Date()) => {
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

  return { start, end };
};

const formatMonthLabel = (date, language) => {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return language === "EN" ? `${month}/${year}` : `${month}/${year}`;
};

const calculateEstimatedElectricCostVnd = (kwh = 0) => {
  const rates = [
    { limit: 50, rate: 1484 },
    { limit: 100, rate: 1533 },
    { limit: 200, rate: 1786 },
    { limit: Infinity, rate: 2242 },
  ];

  let remaining = Number(kwh || 0);
  let cost = 0;

  for (const { limit, rate } of rates) {
    if (remaining <= 0) break;
    const used = Math.min(remaining, limit);
    cost += used * rate;
    remaining -= used;
  }

  return cost;
};

const estimateHouseMonthlyConsumptionKwh = async ({
  houseId,
  rangeStart,
  rangeEnd,
}) => {
  const devices = await Device.find({ house_id: houseId }).lean();
  if (!devices.length) {
    return {
      totalKwh: 0,
      totalRuntimeSeconds: 0,
      totalDevicePowerWatt: 0,
      activePowerWatt: 0,
    };
  }

  const powerByDeviceId = new Map(
    devices.map((device) => [
      String(device._id),
      Number(device.power_watt || 0),
    ]),
  );
  const deviceIds = devices.map((device) => device._id);
  const usages = await DeviceUsage.find({
    device_id: { $in: deviceIds },
    start_time: { $lt: rangeEnd },
    $or: [{ end_time: null }, { end_time: { $gt: rangeStart } }],
  }).lean();

  let totalKwh = 0;
  let totalRuntimeSeconds = 0;
  const usedDeviceIds = new Set();
  const activePowerWatt = devices
    .filter((device) => !!device.status)
    .reduce((sum, device) => sum + Number(device.power_watt || 0), 0);

  for (const usage of usages) {
    const usageStart = usage.start_time;
    const usageEnd = usage.end_time || new Date();
    const overlapSeconds = calculateUsageOverlapSeconds({
      usageStart,
      usageEnd,
      rangeStart,
      rangeEnd,
    });

    if (overlapSeconds <= 0) continue;

    const powerWatt = powerByDeviceId.get(String(usage.device_id)) || 0;
    if (powerWatt <= 0) continue;

    usedDeviceIds.add(String(usage.device_id));
    totalRuntimeSeconds += overlapSeconds;
    totalKwh += (powerWatt * overlapSeconds) / 3600000;
  }

  const totalDevicePowerWatt = devices
    .filter((device) => usedDeviceIds.has(String(device._id)))
    .reduce((sum, device) => sum + Number(device.power_watt || 0), 0);

  return {
    totalKwh,
    totalRuntimeSeconds,
    totalDevicePowerWatt,
    activePowerWatt,
  };
};

const notifyEstimatedCostThresholdForHouse = async ({ houseId }) => {
  const now = new Date();
  const { start, end } = buildCurrentMonthRange(now);
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthlyStats = await estimateHouseMonthlyConsumptionKwh({
    houseId,
    rangeStart: start,
    rangeEnd: end,
  });
  const {
    totalKwh,
    totalRuntimeSeconds,
    totalDevicePowerWatt,
    activePowerWatt,
  } = monthlyStats;

  if (totalKwh <= 0) return;

  const totalEstimatedCostVnd = calculateEstimatedElectricCostVnd(totalKwh);

  const reachedThresholds = ESTIMATED_COST_ALERT_THRESHOLDS.filter(
    (threshold) => totalEstimatedCostVnd >= threshold.vnd,
  );

  for (const threshold of reachedThresholds) {
    const thresholdKey = String(threshold.vnd);
    const alreadyNotified = await Notification.exists({
      house_id: houseId,
      type: "SYSTEM",
      "data.localization_key": "estimated_cost_threshold",
      "data.month_key": monthKey,
      "data.threshold_vnd": thresholdKey,
    });

    if (alreadyNotified) continue;

    await notifyHouseUsers({
      houseId,
      title: "Chi phí điện ước tính đã đạt ngưỡng mới",
      message: `Chi phí điện ước tính trong tháng đã đạt ${Number(threshold.vnd).toLocaleString("vi-VN")} VNĐ.`,
      type: "SYSTEM",
      settingsKey: "consumption_estimate",
      localizationKey: "estimated_cost_threshold",
      data: {
        threshold_vnd: thresholdKey,
        total_cost_vnd: totalEstimatedCostVnd.toFixed(0),
        total_kwh: totalKwh.toFixed(3),
        total_runtime_seconds: String(totalRuntimeSeconds),
        total_runtime_hours: (totalRuntimeSeconds / 3600).toFixed(2),
        total_device_power_watt: String(Math.round(totalDevicePowerWatt)),
        active_power_watt: String(Math.round(activePowerWatt)),
        month_key: monthKey,
        month_label: formatMonthLabel(now, "VI"),
        level: threshold.level,
        target_screen: "StatisticsScreen",
      },
    });
  }
};

const checkAndNotifyConsumptionThresholds = async () => {
  const houseIds = await Device.distinct("house_id", {
    house_id: { $exists: true, $nin: [null, ""] },
  });

  for (const houseId of houseIds) {
    await notifyEstimatedCostThresholdForHouse({ houseId: String(houseId) });
  }
};

const buildDevicePingUrl = (hostOrIp) => {
  const raw = String(hostOrIp || "").trim();
  if (!raw) return null;
  const normalized =
    raw.startsWith("http://") || raw.startsWith("https://")
      ? raw
      : `http://${raw}`;

  try {
    const url = new URL(normalized);
    if (!url.port) {
      url.port = "8080";
    }
    return url.toString().replace(/\/$/, "");
  } catch (error) {
    return normalized;
  }
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
        const now = new Date();
        const update = {
          connectivity_status: nextStatus,
        };

        if (probe.online) {
          update.last_seen_at = now;
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
      }
    } catch (error) {
      console.error("[Notification] Lỗi monitor thiết bị:", error.message);
    }
  }, 60 * 1000);

  console.log("[Notification] Device connectivity monitor started");
};

const initConsumptionThresholdMonitor = () => {
  if (consumptionMonitorTimer) return;

  const run = async () => {
    try {
      await checkAndNotifyConsumptionThresholds();
    } catch (error) {
      console.error(
        "[Notification] Lỗi monitor ngưỡng tiêu thụ:",
        error.message,
      );
    }
  };

  run();
  consumptionMonitorTimer = setInterval(run, 10 * 60 * 1000);
  console.log("[Notification] Consumption threshold monitor started");
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
  initDeviceStatusMonitor,
  initConsumptionThresholdMonitor,
  checkAndNotifyConsumptionThresholds,
  ensureFirebaseAdmin,
  filterUserPushTokens,
};
