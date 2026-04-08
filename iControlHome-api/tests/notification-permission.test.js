const test = require("node:test");
const assert = require("node:assert/strict");

const {
  shouldSendOfflineNotification,
  filterUserPushTokens,
} = require("../services/notificationService");
const { hasControlPermission } = require("../middlewares/auth");

test("shouldSendOfflineNotification throttles repeated offline alerts", () => {
  assert.equal(typeof shouldSendOfflineNotification, "function");

  const now = new Date("2026-04-08T10:00:00.000Z");

  assert.equal(
    shouldSendOfflineNotification({
      previousStatus: "OFFLINE",
      lastNotifiedAt: new Date("2026-04-08T09:55:00.000Z"),
      now,
      cooldownMs: 15 * 60 * 1000,
    }),
    false,
  );

  assert.equal(
    shouldSendOfflineNotification({
      previousStatus: "ONLINE",
      lastNotifiedAt: new Date("2026-04-08T09:30:00.000Z"),
      now,
      cooldownMs: 15 * 60 * 1000,
    }),
    true,
  );
});

test("filterUserPushTokens removes only the active device token", () => {
  assert.equal(typeof filterUserPushTokens, "function");

  assert.deepEqual(
    filterUserPushTokens(["token-a", "token-b", "token-a"], ["token-a"]),
    ["token-b"],
  );

  assert.deepEqual(filterUserPushTokens(["token-a"], ["token-x"]), ["token-a"]);
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
