import { TrackEvent, TransportOptions } from './types';
import { isSupportBeacon, normalizeUrl } from './utils';

/**
 * 传输层类
 * 负责事件数据的发送和缓存
 */
class Transport {
  private options: TransportOptions;
  private queue: TrackEvent[] = [];
  private timer: number | null = null;
  private sending: boolean = false;
  private storage: Storage | null = null;
  private storageKey: string = 'ktrace_events';
  
  /**
   * 构造函数
   */
  constructor(options: TransportOptions) {
    const defaultOptions: Partial<TransportOptions> = {
      maxBatchSize: 10,
      flushInterval: 5000,
      retryTimes: 3,
      useBeacon: true,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    this.options = { ...defaultOptions, ...options };
    this.options.serverUrl = normalizeUrl(this.options.serverUrl);
    
    // 初始化本地存储
    try {
      this.storage = window.localStorage;
      this.loadFromStorage();
    } catch (e) {
      console.warn('[KTrace] 无法访问localStorage:', e);
      this.storage = null;
    }
    
    // 设置定时发送
    this.setupTimer();
  }
  
  /**
   * 发送单个事件
   */
  public send(event: TrackEvent): void {
    this.queue.push(event);
    
    // 如果队列长度达到阈值，立即发送
    if (this.queue.length >= (this.options.maxBatchSize || 10)) {
      this.flush();
    }
  }
  
  /**
   * 刷新队列，发送所有事件
   */
  public flush(useBeacon: boolean = true): void {
    if (this.queue.length === 0 || this.sending) {
      return;
    }
    
    const events = [...this.queue];
    this.queue = [];
    this.sending = true;
    
    // 存储到本地
    this.saveToStorage();
    
    // 检查是否使用Beacon API
    if ((useBeacon || (this.options.useBeacon && window.navigator.onLine === false)) && isSupportBeacon()) {
      this.sendByBeacon(events);
    } else {
      this.sendByXHR(events);
    }
  }
  
  /**
   * 使用XMLHttpRequest发送数据
   */
  private sendByXHR(events: TrackEvent[]): void {
    const xhr = new XMLHttpRequest();
    let retryCount = 0;
    
    const send = () => {
      xhr.open('POST', this.options.serverUrl + 'collect', true);
      
      // 设置请求头
      if (this.options.headers) {
        Object.keys(this.options.headers).forEach(key => {
          xhr.setRequestHeader(key, this.options.headers![key]);
        });
      }
      
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            // 发送成功
            this.sending = false;
            this.removeFromStorage(events);
          } else if (retryCount < (this.options.retryTimes || 3)) {
            console.log('重试', retryCount);
            // 重试
            retryCount++;
            setTimeout(send, 1000 * retryCount);
          } else {
            // 重试失败，放回队列
            this.queue = [...events, ...this.queue];
            this.sending = false;
            this.saveToStorage();
          }
        }
      };
      
      xhr.onerror = () => {
        if (retryCount < (this.options.retryTimes || 3)) {
          // 重试
          retryCount++;
          setTimeout(send, 1000 * retryCount);
        } else {
          // 重试失败，放回队列
          this.queue = [...events, ...this.queue];
          this.sending = false;
          this.saveToStorage();
        }
      };
      
      xhr.send(JSON.stringify(events));
    };
    
    send();
  }
  
  /**
   * 使用Beacon API发送数据
   */
  private sendByBeacon(events: TrackEvent[]): void {
    const success = navigator.sendBeacon(
      this.options.serverUrl + 'collect',
      JSON.stringify(events)
    );
    
    if (!success) {
      // 如果发送失败，放回队列等待下次发送
      this.queue = [...events, ...this.queue];
    } else {
      this.removeFromStorage(events);
    }
    
    this.sending = false;
  }
  
  /**
   * 设置定时发送器
   */
  private setupTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    this.timer = window.setInterval(() => {
      this.flush();
    }, this.options.flushInterval || 5000) as unknown as number;
  }
  
  /**
   * 从本地存储中加载事件
   */
  private loadFromStorage(): void {
    if (!this.storage) return;
    
    try {
      const stored = this.storage.getItem(this.storageKey);
      if (stored) {
        const events = JSON.parse(stored) as TrackEvent[];
        this.queue = [...events, ...this.queue];
      }
    } catch (e) {
      console.warn('[KTrace] 从本地存储加载事件失败:', e);
    }
  }
  
  /**
   * 保存事件到本地存储
   */
  private saveToStorage(): void {
    if (!this.storage) return;
    
    try {
      console.log('saveToStorage', this.storage);
      
      this.storage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (e) {
      console.warn('[KTrace] 保存事件到本地存储失败:', e);
    }
  }
  
  /**
   * 从本地存储中删除已发送的事件
   */
  private removeFromStorage(events: TrackEvent[]): void {
    if (!this.storage) return;
    
    try {
      // 获取当前存储的事件
      const stored = this.storage.getItem(this.storageKey);
      if (stored) {
        const storedEvents = JSON.parse(stored) as TrackEvent[];
        
        // 创建一个事件ID集合，用于快速查找
        const eventIds = new Set(events.map(e => e.id));
        
        // 过滤掉已发送的事件
        const remaining = storedEvents.filter(e => !eventIds.has(e.id));
        
        // 更新存储
        this.storage.setItem(this.storageKey, JSON.stringify(remaining));
      }
    } catch (e) {
      console.warn('[KTrace] 从本地存储删除事件失败:', e);
    }
  }
}

export default Transport; 