declare module "web-push" {
  export interface PushSubscriptionKeys {
    p256dh: string;
    auth: string;
  }
  export interface PushSubscription {
    endpoint: string;
    keys: PushSubscriptionKeys;
  }
  export function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  export function sendNotification(
    subscription: PushSubscription,
    payload: string,
    options?: { TTL?: number },
  ): Promise<unknown>;
}
