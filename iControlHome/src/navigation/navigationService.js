import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

let pendingNotificationTarget = null;

const resolveNotificationTarget = (data = {}) => {
  const explicitTarget = data?.target_screen;
  const key = String(data?.localization_key || data?.type || '')
    .trim()
    .toLowerCase();

  const fallbackTargetMap = {
    member: 'ManageMembers',
    new_member: 'ManageMembers',
    permission: 'Main',
    permission_granted: 'Main',
    device: 'DeviceLogScreen',
    device_status: 'DeviceLogScreen',
    automation: 'DeviceLogScreen',
    automation_triggered: 'DeviceLogScreen',
    estimated_cost_threshold: 'StatisticsScreen',
    system: 'DeviceLogScreen',
    device_offline: 'DeviceLogScreen',
    camera: 'EntryExitScreen',
    camera_detected: 'EntryExitScreen',
  };

  const name = explicitTarget || fallbackTargetMap[key] || 'Main';

  return {
    name,
    params: {
      notificationData: data,
    },
  };
};

const navigateToTarget = target => {
  if (!target?.name) return false;

  if (!navigationRef.isReady()) {
    pendingNotificationTarget = target;
    return false;
  }

  navigationRef.navigate(target.name, target.params);
  return true;
};

export const navigateFromNotificationData = data => {
  const target = resolveNotificationTarget(data);
  return navigateToTarget(target);
};

export const flushPendingNotificationNavigation = () => {
  if (!pendingNotificationTarget || !navigationRef.isReady()) {
    return false;
  }

  const target = pendingNotificationTarget;
  pendingNotificationTarget = null;
  navigationRef.navigate(target.name, target.params);
  return true;
};
