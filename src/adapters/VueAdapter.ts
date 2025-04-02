import Tracker from '../core/Tracker';
import { TrackerConfig } from '../core/types';

// Vue插件类型
type VueInstance = any;

/**
 * Vue适配器类
 */
class VueAdapter {
  private tracker: Tracker;
  private options: TrackerConfig;
  private routerHooksInstalled: boolean = false;
  
  /**
   * 构造函数
   */
  constructor(options: TrackerConfig) {
    this.options = options;
    this.tracker = new Tracker(options);
  }
  
  /**
   * 安装Vue插件
   */
  public install(Vue: VueInstance, options?: Partial<TrackerConfig>): void {
    if (options) {
      this.options = { ...this.options, ...options };
      this.tracker.init(this.options);
    }
    
    // 添加实例方法
    Vue.prototype.$track = (eventName: string, properties?: Record<string, any>) => {
      this.tracker.track(eventName, properties);
    };
    
    Vue.prototype.$identify = (userId: string, userProperties?: Record<string, any>) => {
      this.tracker.identify(userId, userProperties);
    };
    
    Vue.prototype.$trackPageView = (pageName: string, properties?: Record<string, any>) => {
      this.tracker.trackPageView(pageName, properties);
    };
    
    // 创建指令
    Vue.directive('track-click', {
      bind: (el: HTMLElement, binding: any, vnode: any) => {
        el.addEventListener('click', () => {
          const eventName = binding.value?.event || 'click';
          const properties = binding.value?.properties || {};
          
          // 添加元素信息
          const elementInfo = {
            tagName: el.tagName.toLowerCase(),
            className: el.className,
            id: el.id,
            text: el.textContent?.substring(0, 50).trim()
          };
          
          this.tracker.track(eventName, {
            ...properties,
            element: elementInfo
          });
        });
      }
    });
    
    // 添加全局mixin，用于自动追踪页面访问
    Vue.mixin({
      beforeCreate() {
        // 检查是否启用了Vue Router
        if (!this.routerHooksInstalled && 
            this.$options && 
            this.$options.router) {
          this.installRouterHooks(this.$options.router);
        }
      },
      
      mounted() {
        // 仅追踪根组件的挂载，避免重复
        if (this.$root === this && this.$options.name) {
          this.$trackPageView(this.$options.name, {
            path: window.location.pathname
          });
        }
      }
    });
  }
  
  /**
   * 安装Vue Router钩子
   */
  private installRouterHooks(router: any): void {
    if (!router || this.routerHooksInstalled) return;
    
    router.afterEach((to: any) => {
      // 在路由变化后追踪页面访问
      const pageName = to.name || to.path;
      const properties = {
        path: to.path,
        fullPath: to.fullPath,
        query: to.query,
        params: to.params
      };
      
      this.tracker.trackPageView(pageName, properties);
    });
    
    this.routerHooksInstalled = true;
  }
  
  /**
   * 获取Tracker实例
   */
  public getTracker(): Tracker {
    return this.tracker;
  }
}

// 导出一个创建Vue插件的工厂函数
export default function createVueAdapter(options: TrackerConfig) {
  const adapter = new VueAdapter(options);
  
  // 返回一个符合Vue插件规范的对象
  return {
    install(Vue: VueInstance, installOptions?: Partial<TrackerConfig>) {
      adapter.install(Vue, installOptions);
    },
    // 暴露原始tracker和adapter实例
    tracker: adapter.getTracker(),
    adapter
  };
} 