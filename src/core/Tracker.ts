import { v4 as uuidv4 } from 'uuid';
import Transport from './Transport';
import { 
  TrackerConfig, 
  TrackEvent, 
  EventType, 
  Plugin,
  DeviceInfo
} from './types';
import { getDeviceInfo } from './utils';

/**
 * 核心追踪器类
 */
class Tracker {
  private config: TrackerConfig;
  private transport: Transport;
  private plugins: Plugin[] = [];
  private sessionId: string;
  private userId: string | null = null;
  private deviceInfo: DeviceInfo;
  public version: string = '1.0.0';
  
  /**
   * 构造函数
   */
  constructor(config?: Partial<TrackerConfig>) {
    // 默认配置
    const defaultConfig: TrackerConfig = {
      appId: '',
      serverUrl: '',
      enableAutoTrack: true,
      debug: false,
      maxBatchSize: 10,
      flushInterval: 5000,
      sampleRate: 1.0
    };
    
    this.config = { ...defaultConfig, ...config };
    this.sessionId = this.generateSessionId();
    this.deviceInfo = getDeviceInfo();
    
    // 初始化传输层
    this.transport = new Transport({
      serverUrl: this.config.serverUrl,
      maxBatchSize: this.config.maxBatchSize,
      flushInterval: this.config.flushInterval
    });
    
    // 如果启用了自动追踪
    if (this.config.enableAutoTrack) {
      this.setupAutoTracking();
    }
    
    // 初始化插件
    if (this.config.plugins && this.config.plugins.length > 0) {
      this.registerPlugins(this.config.plugins);
    }
  }
  
  /**
   * 初始化SDK
   */
  public init(config: TrackerConfig): void {
    this.config = { ...this.config, ...config };
    
    // 重新初始化传输层
    this.transport = new Transport({
      serverUrl: this.config.serverUrl,
      maxBatchSize: this.config.maxBatchSize,
      flushInterval: this.config.flushInterval
    });
    
    // 日志
    if (this.config.debug) {
      console.log('[KTrace] SDK 初始化成功:', this.config);
    }
  }
  
  /**
   * 设置用户标识
   */
  public identify(userId: string, userProperties?: Record<string, any>): void {
    this.userId = userId;
    
    // 记录用户标识事件
    this.track('user_identify', {
      userId,
      ...userProperties
    });
    
    if (this.config.debug) {
      console.log(`[KTrace] 设置用户 ID: ${userId}`);
    }
  }
  
  /**
   * 追踪事件
   */
  public track(eventName: string, properties?: Record<string, any>): void {
    // 采样率过滤
    if (Math.random() > this.config.sampleRate!) {
      return;
    }
    
    let event: TrackEvent = {
      id: uuidv4(),
      type: EventType.CUSTOM,
      name: eventName,
      timestamp: Date.now(),
      properties: properties || {},
      userId: this.userId || undefined,
      sessionId: this.sessionId,
      deviceInfo: this.deviceInfo
    };
    
    // 应用插件的前置处理
    for (const plugin of this.plugins) {
      if (plugin.beforeTrack) {
        const processedEvent = plugin.beforeTrack(event);
        if (!processedEvent) return; // 如果插件返回null，则取消事件
        event = processedEvent;
      }
    }
    
    // 发送事件
    this.transport.send(event);
    
    // 应用插件的后置处理
    for (const plugin of this.plugins) {
      if (plugin.afterTrack) {
        plugin.afterTrack(event);
      }
    }
    
    if (this.config.debug) {
      console.log(`[KTrace] 追踪事件: ${eventName}`, event);
    }
  }
  
  /**
   * 追踪页面访问
   */
  public trackPageView(pageName: string, properties?: Record<string, any>): void {
    this.track(pageName, {
      type: EventType.PAGE_VIEW,
      ...properties
    });
  }
  
  /**
   * 追踪错误
   */
  public trackError(error: Error, context?: Record<string, any>): void {
    this.track('error', {
      type: EventType.ERROR,
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...context
    });
  }
  
  /**
   * 注册插件
   */
  public registerPlugins(plugins: Plugin[]): void {
    for (const plugin of plugins) {
      this.plugins.push(plugin);
      
      // 初始化插件
      if (plugin.init) {
        plugin.init(this);
      }
      
      if (this.config.debug) {
        console.log(`[KTrace] 插件已注册: ${plugin.name}`);
      }
    }
  }
  
  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return uuidv4();
  }
  
  /**
   * 设置自动追踪
   */
  private setupAutoTracking(): void {
    if (typeof window !== 'undefined') {
      // 页面加载完成事件
      window.addEventListener('load', () => {
        this.trackPageView('page_load', {
          url: window.location.href,
          title: document.title,
          referrer: document.referrer
        });
      });
      
      // 页面离开事件
      window.addEventListener('beforeunload', () => {
        this.track('page_leave', {
          url: window.location.href,
          title: document.title,
          duration: Date.now() - (window as any).__pageLoadTime || 0
        });
        
        // 强制发送数据
        this.transport.flush(true);
      });
      
      // 记录页面加载时间
      (window as any).__pageLoadTime = Date.now();
    }
  }
}

export default Tracker; 