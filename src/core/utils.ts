import { DeviceInfo } from './types';

// 为Navigator添加connection属性类型声明
declare global {
  interface Navigator {
    connection?: {
      effectiveType?: string;
      type?: string;
    };
  }
}

/**
 * 获取设备信息
 */
export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  let os = 'unknown';
  let osVersion = 'unknown';
  let browser = 'unknown';
  let browserVersion = 'unknown';
  
  // 操作系统检测
  if (ua.indexOf('Windows') !== -1) {
    os = 'Windows';
    const match = ua.match(/Windows NT (\d+\.\d+)/);
    if (match) {
      const versionMap: Record<string, string> = {
        '10.0': '10',
        '6.3': '8.1',
        '6.2': '8',
        '6.1': '7',
        '6.0': 'Vista',
        '5.2': 'XP',
        '5.1': 'XP'
      };
      osVersion = versionMap[match[1]] || match[1];
    }
  } else if (ua.indexOf('Macintosh') !== -1) {
    os = 'MacOS';
    const match = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
    if (match) {
      osVersion = match[1].replace(/_/g, '.');
    }
  } else if (ua.indexOf('Android') !== -1) {
    os = 'Android';
    const match = ua.match(/Android (\d+(\.\d+)+)/);
    if (match) {
      osVersion = match[1];
    }
  } else if (ua.indexOf('iOS') !== -1 || ua.indexOf('iPhone') !== -1 || ua.indexOf('iPad') !== -1) {
    os = 'iOS';
    const match = ua.match(/OS (\d+[._]\d+[._]?\d*)/);
    if (match) {
      osVersion = match[1].replace(/_/g, '.');
    }
  } else if (ua.indexOf('Linux') !== -1) {
    os = 'Linux';
  }
  
  // 浏览器检测
  if (ua.indexOf('Chrome') !== -1 && ua.indexOf('Edg') === -1 && ua.indexOf('OPR') === -1) {
    browser = 'Chrome';
    const match = ua.match(/Chrome\/(\d+(\.\d+)+)/);
    if (match) {
      browserVersion = match[1];
    }
  } else if (ua.indexOf('Firefox') !== -1) {
    browser = 'Firefox';
    const match = ua.match(/Firefox\/(\d+(\.\d+)+)/);
    if (match) {
      browserVersion = match[1];
    }
  } else if (ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1) {
    browser = 'Safari';
    const match = ua.match(/Version\/(\d+(\.\d+)+)/);
    if (match) {
      browserVersion = match[1];
    }
  } else if (ua.indexOf('Edg') !== -1) {
    browser = 'Edge';
    const match = ua.match(/Edg\/(\d+(\.\d+)+)/);
    if (match) {
      browserVersion = match[1];
    }
  } else if (ua.indexOf('OPR') !== -1 || ua.indexOf('Opera') !== -1) {
    browser = 'Opera';
    const match = ua.match(/OPR\/(\d+(\.\d+)+)/);
    if (match) {
      browserVersion = match[1];
    }
  } else if (ua.indexOf('Trident') !== -1 || ua.indexOf('MSIE') !== -1) {
    browser = 'Internet Explorer';
    const match = ua.match(/rv:(\d+(\.\d+)+)/) || ua.match(/MSIE (\d+(\.\d+)+)/);
    if (match) {
      browserVersion = match[1];
    }
  }
  
  // 屏幕信息
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // 网络信息
  let network = 'unknown';
  if (navigator.connection) {
    network = navigator.connection.effectiveType || navigator.connection.type || 'unknown';
  }
  
  return {
    os,
    osVersion,
    browser,
    browserVersion,
    screenWidth,
    screenHeight,
    viewportWidth,
    viewportHeight,
    network
  };
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(later, wait) as unknown as number;
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 检查是否支持Beacon API
 */
export function isSupportBeacon(): boolean {
  return navigator && typeof navigator.sendBeacon === 'function';
}

/**
 * 确保URL格式正确
 */
export function normalizeUrl(url: string): string {
  if (!url) return '';
  
  if (!url.endsWith('/')) {
    url = url + '/';
  }
  
  return url;
} 