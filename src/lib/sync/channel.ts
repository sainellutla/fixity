import type { Action } from './store'

const CHANNEL_NAME = 'civiclens-sync'

export type SyncListener = (action: Action) => void

/**
 * Wraps BroadcastChannel for cross-tab action replay, with the caller responsible for
 * also subscribing to the `storage` event (see useBroadcastSync) as a fallback for
 * browsers/contexts where BroadcastChannel is unavailable.
 */
export class SyncChannel {
  private channel: BroadcastChannel | null = null
  private onAction: SyncListener

  constructor(onAction: SyncListener) {
    this.onAction = onAction
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL_NAME)
      this.channel.onmessage = (event: MessageEvent<Action>) => {
        this.onAction(event.data)
      }
    }
  }

  get isSupported(): boolean {
    return this.channel !== null
  }

  post(action: Action): void {
    this.channel?.postMessage(action)
  }

  close(): void {
    this.channel?.close()
    this.channel = null
  }
}
