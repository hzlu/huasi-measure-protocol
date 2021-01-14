// 扭角数据载荷
type INodesTwist = [string, number][];

// 阵列位移计采集器命令参数
export interface ICmdOptions {
  [option: string]: string | number | boolean | INodesTwist | undefined;
  calType?: number; // 起算方式
  layType?: number; // 布设方式
  interval?: number; // 采集频率
  initTwist?: number; // 设备初始扭转角
  nodesTwist?: INodesTwist; // 设置扭角
  uploadMode?: number; // 数据上传模式
  glimit?: number; // 门限值
  historyFrom?: number; // 获取历史数据开始时间戳
  historyTo?: number; // 获取历史数据结束时间戳
}
