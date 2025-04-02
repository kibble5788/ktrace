import Tracker from '../core/Tracker';
import { TrackerConfig } from '../core/types';

// React适配器接口
export interface ReactAdapterType {
  tracker: Tracker;
  track: (eventName: string, properties?: Record<string, any>) => void;
  trackPageView: (pageName: string, properties?: Record<string, any>) => void;
  identify: (userId: string, userProperties?: Record<string, any>) => void;
}

/**
 * React适配器类
 */
class ReactAdapter {
  private tracker: Tracker;
  
  /**
   * 构造函数
   */
  constructor(config: TrackerConfig) {
    this.tracker = new Tracker(config);
    this.tracker.init(config);
  }
  
  /**
   * 追踪事件
   */
  public track(eventName: string, properties?: Record<string, any>): void {
    this.tracker.track(eventName, properties);
  }
  
  /**
   * 追踪页面访问
   */
  public trackPageView(pageName: string, properties?: Record<string, any>): void {
    this.tracker.trackPageView(pageName, properties);
  }
  
  /**
   * 设置用户标识
   */
  public identify(userId: string, userProperties?: Record<string, any>): void {
    this.tracker.identify(userId, userProperties);
  }
  
  /**
   * 获取追踪器实例
   */
  public getTracker(): Tracker {
    return this.tracker;
  }
  
  /**
   * 创建React Hook使用的对象
   */
  public createHook(): ReactAdapterType {
    return {
      tracker: this.tracker,
      track: this.track.bind(this),
      trackPageView: this.trackPageView.bind(this),
      identify: this.identify.bind(this)
    };
  }
  
  /**
   * 路由改变时自动追踪
   */
  public trackRouteChange(location: { pathname: string; search: string }, routeName?: string): void {
    const pageName = routeName || location.pathname;
    this.trackPageView(pageName, {
      path: location.pathname,
      search: location.search,
      url: window.location.href
    });
  }
}

// 工厂函数，创建React适配器
export default function createReactAdapter(config: TrackerConfig): ReactAdapter {
  return new ReactAdapter(config);
} 