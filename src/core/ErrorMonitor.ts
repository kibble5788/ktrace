import Tracker from './Tracker';
import { ErrorInfo } from './types';

/**
 * 错误监控类
 * 负责捕获和处理各种类型的错误
 */
class ErrorMonitor {
  private tracker: Tracker;
  private initialized: boolean = false;
  private ignoreList: RegExp[] = [];
  
  /**
   * 构造函数
   */
  constructor(tracker: Tracker) {
    this.tracker = tracker;
  }
  
  /**
   * 初始化错误监控
   */
  public init(options: {
    ignoreErrors?: RegExp[];
    captureJsError?: boolean;
    capturePromiseError?: boolean;
    captureAjaxError?: boolean;
    captureResourceError?: boolean;
  } = {}): void {
    if (this.initialized) return;
    
    // 设置忽略规则
    if (options.ignoreErrors) {
      this.ignoreList = options.ignoreErrors;
    }
    
    // 捕获JS异常
    if (options.captureJsError !== false) {
      this.captureJsErrors();
    }
    
    // 捕获Promise错误
    if (options.capturePromiseError !== false) {
      this.capturePromiseErrors();
    }
    
    // 捕获Ajax错误
    if (options.captureAjaxError !== false) {
      this.captureAjaxErrors();
    }
    
    // 捕获资源加载错误
    if (options.captureResourceError !== false) {
      this.captureResourceErrors();
    }
    
    this.initialized = true;
  }
  
  /**
   * 捕获JavaScript错误
   */
  private captureJsErrors(): void {
    window.addEventListener('error', (event) => {
      // 忽略资源加载错误，这些会由captureResourceErrors处理
      if (event.error && event.error instanceof Error) {
        const error = event.error;
        
        // 检查是否应该忽略
        if (this.shouldIgnore(error.message)) {
          return;
        }
        
        const errorInfo: ErrorInfo = {
          name: error.name,
          message: error.message,
          stack: error.stack,
          category: 'js_error',
          context: {
            url: window.location.href,
            line: event.lineno,
            column: event.colno,
            filename: event.filename
          }
        };
        
        this.reportError(errorInfo);
      }
    }, true);
  }
  
  /**
   * 捕获Promise未处理的拒绝
   */
  private capturePromiseErrors(): void {
    window.addEventListener('unhandledrejection', (event) => {
      let errorInfo: ErrorInfo;
      
      if (event.reason instanceof Error) {
        // 检查是否应该忽略
        if (this.shouldIgnore(event.reason.message)) {
          return;
        }
        
        errorInfo = {
          name: event.reason.name,
          message: event.reason.message,
          stack: event.reason.stack,
          category: 'unhandled_promise_rejection',
          context: {
            url: window.location.href
          }
        };
      } else {
        let reason = String(event.reason);
        
        // 检查是否应该忽略
        if (this.shouldIgnore(reason)) {
          return;
        }
        
        errorInfo = {
          name: 'UnhandledPromiseRejection',
          message: reason,
          category: 'unhandled_promise_rejection',
          context: {
            url: window.location.href
          }
        };
      }
      
      this.reportError(errorInfo);
    });
  }
  
  /**
   * 捕获Ajax请求错误
   */
  private captureAjaxErrors(): void {
    if (!window.XMLHttpRequest) return;
    
    const originalSend = XMLHttpRequest.prototype.send;
    const originalOpen = XMLHttpRequest.prototype.open;
    
    // 保存this的引用
    const self = this;
    
    // 重写open方法以记录请求信息
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null): void {
      (this as any).__ktrace_request = {
        method,
        url: url.toString(),
        startTime: Date.now()
      };
      originalOpen.call(this, method, url, async === undefined ? true : async, username ?? null, password ?? null);
    };
    
    // 重写send方法以添加错误监听
    XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null): void {
      const xhr = this;
      
      // 添加load事件监听
      xhr.addEventListener('load', function() {
        if (xhr.status >= 400) {
          const request = (xhr as any).__ktrace_request || {};
          const duration = Date.now() - (request.startTime || Date.now());
          
          const errorInfo: ErrorInfo = {
            name: 'HttpError',
            message: `HTTP错误 ${xhr.status} (${xhr.statusText})`,
            category: 'http_error',
            context: {
              url: request.url,
              method: request.method,
              status: xhr.status,
              response: xhr.responseText?.substring(0, 200),
              duration
            }
          };
          
          self.reportError(errorInfo);
        }
      });
      
      // 添加error事件监听
      xhr.addEventListener('error', function() {
        const request = (xhr as any).__ktrace_request || {};
        const duration = Date.now() - (request.startTime || Date.now());
        
        const errorInfo: ErrorInfo = {
          name: 'HttpRequestError',
          message: `请求失败 ${request.url}`,
          category: 'http_request_error',
          context: {
            url: request.url,
            method: request.method,
            duration
          }
        };
        
        self.reportError(errorInfo);
      });
      
      originalSend.call(xhr, body);
    };
  }
  
  /**
   * 捕获资源加载错误
   */
  private captureResourceErrors(): void {
    window.addEventListener('error', (event) => {
      const target = event.target as HTMLElement;
      
      // 仅处理资源元素的错误
      if (target && (
        target.tagName === 'SCRIPT' || 
        target.tagName === 'LINK' || 
        target.tagName === 'IMG' || 
        target.tagName === 'AUDIO' || 
        target.tagName === 'VIDEO'
      )) {
        let url = '';
        
        if (target instanceof HTMLScriptElement || 
            target instanceof HTMLImageElement || 
            target instanceof HTMLAudioElement || 
            target instanceof HTMLVideoElement) {
          url = target.src;
        } else if (target instanceof HTMLLinkElement) {
          url = target.href;
        }
        
        // 检查是否应该忽略
        if (this.shouldIgnore(url)) {
          return;
        }
        
        const errorInfo: ErrorInfo = {
          name: 'ResourceError',
          message: `无法加载资源: ${url}`,
          category: 'resource_error',
          context: {
            url: window.location.href,
            resourceUrl: url,
            resourceType: target.tagName.toLowerCase()
          }
        };
        
        this.reportError(errorInfo);
      }
    }, true);
  }
  
  /**
   * 手动报告错误
   */
  public reportError(errorInfo: ErrorInfo): void {
    if (this.shouldIgnore(errorInfo.message)) {
      return;
    }
    
    // 使用tracker发送错误信息
    this.tracker.trackError(new Error(errorInfo.message), {
      name: errorInfo.name,
      category: errorInfo.category,
      context: errorInfo.context,
      stack: errorInfo.stack
    });
  }
  
  /**
   * 检查是否应该忽略错误
   */
  private shouldIgnore(message: string): boolean {
    if (!message) return false;
    
    return this.ignoreList.some(pattern => pattern.test(message));
  }
}

export default ErrorMonitor; 