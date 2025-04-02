import Tracker from './core/Tracker';
import { version } from '../package.json';

// 导出主要模块
export { default as Tracker } from './core/Tracker';
export { default as Transport } from './core/Transport';
export { default as ErrorMonitor } from './core/ErrorMonitor';

// 导出适配器
export { default as VueAdapter } from './adapters/VueAdapter';
export { default as ReactAdapter } from './adapters/ReactAdapter';
export { default as ElectronAdapter } from './adapters/ElectronAdapter';

// 默认导出SDK主类实例
const ktrace = new Tracker();

// 添加版本信息
ktrace.version = version;

export default ktrace; 