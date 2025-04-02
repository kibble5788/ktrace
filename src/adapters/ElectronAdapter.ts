import Tracker from '../core/Tracker';
import { TrackerConfig } from '../core/types';

// 安全地引入electron
let electron: any = null;
try {
  electron = require('electron');
} catch (e) {
  // Electron模块不可用，这是预期的行为
  // 当在非Electron环境中使用时
}

/**
 * Electron适配器类
 * 用于在Electron应用中实现埋点功能
 */
class ElectronAdapter {
  private tracker: Tracker;
  private mainConfig: TrackerConfig;
  private ipcMain: any = null;
  private ipcRenderer: any = null;
  private isMain: boolean;
  private isElectronAvailable: boolean = false;
  
  /**
   * 构造函数
   */
  constructor(config: TrackerConfig, isMain: boolean = false) {
    this.mainConfig = config;
    this.tracker = new Tracker(config);
    this.isMain = isMain;
    
    if (electron) {
      this.isElectronAvailable = true;
      
      if (isMain && electron.ipcMain) {
        // 在主进程中
        this.ipcMain = electron.ipcMain;
        this.setupMainProcess();
      } else if (!isMain && electron.ipcRenderer) {
        // 在渲染进程中
        this.ipcRenderer = electron.ipcRenderer;
        this.setupRendererProcess();
      }
    } else {
      console.warn('[KTrace] Electron不可用，将回退到基本模式');
    }
  }
  
  /**
   * 初始化
   */
  public init(): void {
    this.tracker.init(this.mainConfig);
  }
  
  /**
   * 设置主进程通信
   */
  private setupMainProcess(): void {
    if (!this.ipcMain) return;
    
    // 监听来自渲染进程的事件
    this.ipcMain.on('ktrace-track-event', (_event: any, eventData: any) => {
      this.tracker.track(eventData.name, eventData.properties);
    });
    
    this.ipcMain.on('ktrace-page-view', (_event: any, eventData: any) => {
      this.tracker.trackPageView(eventData.pageName, eventData.properties);
    });
    
    this.ipcMain.on('ktrace-identify', (_event: any, userData: any) => {
      this.tracker.identify(userData.userId, userData.userProperties);
    });
    
    this.ipcMain.on('ktrace-error', (_event: any, errorData: any) => {
      const error = new Error(errorData.message);
      error.name = errorData.name;
      error.stack = errorData.stack;
      
      this.tracker.trackError(error, errorData.context);
    });
  }
  
  /**
   * 设置渲染进程通信
   */
  private setupRendererProcess(): void {
    if (!this.ipcRenderer) return;
    
    // 重写方法，将调用转发到主进程
    this.track = (eventName: string, properties?: Record<string, any>) => {
      this.ipcRenderer.send('ktrace-track-event', {
        name: eventName,
        properties
      });
    };
    
    this.trackPageView = (pageName: string, properties?: Record<string, any>) => {
      this.ipcRenderer.send('ktrace-page-view', {
        pageName,
        properties
      });
    };
    
    this.identify = (userId: string, userProperties?: Record<string, any>) => {
      this.ipcRenderer.send('ktrace-identify', {
        userId,
        userProperties
      });
    };
    
    this.trackError = (error: Error, context?: Record<string, any>) => {
      this.ipcRenderer.send('ktrace-error', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        context
      });
    };
  }
  
  /**
   * 追踪事件
   */
  public track(eventName: string, properties?: Record<string, any>): void {
    // 如果是主进程或者ipcRenderer未成功加载，直接使用tracker
    if (this.isMain || !this.isElectronAvailable || !this.ipcRenderer) {
      this.tracker.track(eventName, properties);
    }
    // 否则会被setupRendererProcess重写，转发到主进程
  }
  
  /**
   * 追踪页面访问
   */
  public trackPageView(pageName: string, properties?: Record<string, any>): void {
    if (this.isMain || !this.isElectronAvailable || !this.ipcRenderer) {
      this.tracker.trackPageView(pageName, properties);
    }
  }
  
  /**
   * 设置用户标识
   */
  public identify(userId: string, userProperties?: Record<string, any>): void {
    if (this.isMain || !this.isElectronAvailable || !this.ipcRenderer) {
      this.tracker.identify(userId, userProperties);
    }
  }
  
  /**
   * 追踪错误
   */
  public trackError(error: Error, context?: Record<string, any>): void {
    if (this.isMain || !this.isElectronAvailable || !this.ipcRenderer) {
      this.tracker.trackError(error, context);
    }
  }
  
  /**
   * 获取Tracker实例
   */
  public getTracker(): Tracker {
    return this.tracker;
  }
  
  /**
   * 检查Electron是否可用
   */
  public isElectron(): boolean {
    return this.isElectronAvailable;
  }
}

// 工厂函数
export default function createElectronAdapter(
  config: TrackerConfig,
  isMain: boolean = false
): ElectronAdapter {
  return new ElectronAdapter(config, isMain);
} 