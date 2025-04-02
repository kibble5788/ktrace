/** 埋点追踪器的基础配置接口
 * 定义了初始化追踪器所需的各种参数
 */
export interface TrackerConfig {
  /** 应用唯一标识符，必填项 */
  appId: string;
  /** 数据上报的服务器地址，必填项 */
  serverUrl: string;
  /** 应用版本号，可选 */
  appVersion?: string;
  /** 是否启用自动埋点功能，可选 */
  enableAutoTrack?: boolean;
  /** 是否开启调试模式，开启后会输出日志，可选 */
  debug?: boolean;
  /** 批量上报的最大事件数，超过此数量则触发上报，可选 */
  maxBatchSize?: number;
  /** 定时上报的时间间隔(毫秒)，可选 */
  flushInterval?: number;
  /** 采样率(0-1之间)，用于控制数据采集比例，可选 */
  sampleRate?: number;
  /** 插件列表，用于扩展追踪器功能，可选 */
  plugins?: any[];
}

/** 设备信息接口
 * 用于收集和存储用户设备的相关信息
 */
export interface DeviceInfo {
  /** 操作系统类型，如iOS、Android、Windows等 */
  os: string;
  /** 操作系统版本号 */
  osVersion: string;
  /** 设备型号，如iPhone 13、Samsung Galaxy S21等，可选 */
  deviceModel?: string;
  /** 屏幕物理宽度(像素)，可选 */
  screenWidth?: number;
  /** 屏幕物理高度(像素)，可选 */
  screenHeight?: number;
  /** 浏览器视口宽度，可选 */
  viewportWidth?: number;
  /** 浏览器视口高度，可选 */
  viewportHeight?: number;
  /** 浏览器类型，如Chrome、Safari等，可选 */
  browser?: string;
  /** 浏览器版本号，可选 */
  browserVersion?: string;
  /** 网络连接类型，如wifi、4g、5g等，可选 */
  network?: string;
}

/** 埋点事件接口
 * 定义了一个埋点事件的完整结构
 */
export interface TrackEvent {
  /** 事件唯一标识符 */
  id: string;
  /** 事件类型，来自EventType枚举 */
  type: EventType;
  /** 事件名称，用于标识特定事件 */
  name: string;
  /** 事件发生的时间戳(毫秒) */
  timestamp: number;
  /** 事件相关的自定义属性，可选 */
  properties?: Record<string, any>;
  /** 用户唯一标识符，可选 */
  userId?: string;
  /** 会话唯一标识符，可选 */
  sessionId?: string;
  /** 设备信息，可选 */
  deviceInfo?: DeviceInfo;
}

/** 埋点事件类型枚举
 * 定义了系统支持的各种事件类型
 */
export enum EventType {
  /** 页面浏览事件 */
  PAGE_VIEW = 'page_view',
  /** 点击事件 */
  CLICK = 'click',
  /** 自定义事件 */
  CUSTOM = 'custom',
  /** 错误事件 */
  ERROR = 'error',
  /** 性能监控事件 */
  PERFORMANCE = 'performance',
  /** 应用生命周期事件 */
  LIFECYCLE = 'lifecycle'
}

/** 插件接口
 * 定义了插件的结构，用于扩展追踪器功能
 */
export interface Plugin {
  /** 插件名称 */
  name: string;
  /** 插件初始化方法，接收追踪器实例作为参数，可选 */
  init?: (tracker: any) => void;
  /** 事件上报前的处理钩子，可以修改或过滤事件，可选
   * 返回null时将阻止事件上报
   */
  beforeTrack?: (event: TrackEvent) => TrackEvent | null;
  /** 事件上报后的处理钩子，可选 */
  afterTrack?: (event: TrackEvent) => void;
  /** 插件销毁方法，用于清理资源，可选 */
  destroy?: () => void;
}

/** 错误监控接口
 * 定义了错误事件的数据结构
 */
export interface ErrorInfo {
  /** 错误名称 */
  name: string;
  /** 错误信息 */
  message: string;
  /** 错误堆栈信息，可选 */
  stack?: string;
  /** 错误发生时的上下文信息，可选 */
  context?: Record<string, any>;
  /** 错误分类，如js错误、网络错误等，可选 */
  category?: string;
}

/** 传输层接口
 * 定义了数据上报的配置选项
 */
export interface TransportOptions {
  /** 数据上报的服务器地址 */
  serverUrl: string;
  /** 批量上报的最大事件数，可选 */
  maxBatchSize?: number;
  /** 定时上报的时间间隔(毫秒)，可选 */
  flushInterval?: number;
  /** 上报失败后的重试次数，可选 */
  retryTimes?: number;
  /** 请求头信息，可选 */
  headers?: Record<string, string>;
  /** 是否使用Beacon API进行上报，适用于页面关闭前的数据发送，可选 */
  useBeacon?: boolean;
}

/** 用户会话接口
 * 定义了用户会话的数据结构
 */
export interface UserSession {
  /** 会话唯一标识符 */
  sessionId: string;
  /** 用户唯一标识符，可选 */
  userId?: string;
  /** 会话开始时间(时间戳，毫秒) */
  startTime: number;
  /** 最后活动时间(时间戳，毫秒)，用于判断会话是否过期 */
  lastActivityTime: number;
  /** 会话相关的自定义属性，可选 */
  properties?: Record<string, any>;
} 