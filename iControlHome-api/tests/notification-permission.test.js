const test = require("node:test");
const assert = require("node:assert/strict");

const {
  filterUserPushTokens,
  mergeNotificationSettings,
} = require("../services/notificationService");
const { hasControlPermission } = require("../middlewares/auth");

test("filterUserPushTokens removes only the active device token", () => {
  assert.equal(typeof filterUserPushTokens, "function");

  assert.deepEqual(
    filterUserPushTokens(["token-a", "token-b", "token-a"], ["token-a"]),
    ["token-b"],
  );

  assert.deepEqual(filterUserPushTokens(["token-a"], ["token-x"]), ["token-a"]);
});

test("mergeNotificationSettings keeps per-user flags and strips legacy offline keys", () => {
  assert.equal(typeof mergeNotificationSettings, "function");

  const merged = mergeNotificationSettings(
    {
      enabled: false,
      new_member: false,
    },
    {
      device_status: true,
      camera_detected: false,
      device_offline: false,
    },
  );

  assert.equal(merged.enabled, false);
  assert.equal(merged.new_member, false);
  assert.equal(merged.device_status, true);
  assert.equal(merged.camera_detected, false);
  assert.equal(Object.hasOwn(merged, "device_offline"), false);
});

test("hasControlPermission respects owner, room, and device permissions", () => {
  assert.equal(typeof hasControlPermission, "function");

  const device = {
    permissions: [{ user_id: "member-2", can_control: true }],
  };
  const room = {
    permissions: [{ user_id: "member-1", can_control: true }],
  };

  assert.equal(
    hasControlPermission({
      userId: "owner-1",
      role: "OWNER",
      device,
      room,
    }),
    true,
  );

  assert.equal(
    hasControlPermission({
      userId: "member-1",
      role: "MEMBER",
      device,
      room,
    }),
    true,
  );

  assert.equal(
    hasControlPermission({
      userId: "member-2",
      role: "MEMBER",
      device,
      room: { permissions: [] },
    }),
    true,
  );

  assert.equal(
    hasControlPermission({
      userId: "member-3",
      role: "MEMBER",
      device,
      room,
    }),
    false,
  );
});
