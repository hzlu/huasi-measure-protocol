import moment from 'moment';
import { ICmdOptions } from '../types';
import { TxtCommands } from '../constants';
import { checksum, firstByteString } from '../utils';

export class TxtCommandCreator {
  // 设备序列号
  private sncode: string;

  constructor(sncode: string) {
    this.sncode = sncode;
  }

  /**
   * 包装命令，输出可直接发送
   * @param {string} command 命令字符串
   * @return {Buffer}
   */
  private wrapCommand(command: string): Buffer {
    // 校验和
    const checksumBuffer = checksum(Buffer.from(command));
    const checksumString = firstByteString(checksumBuffer);

    return Buffer.concat([
      Buffer.from('$'),
      Buffer.from(command),
      Buffer.from('*'),
      Buffer.from(checksumString),
      Buffer.from([0x0D, 0x0A]),
    ]);
  }

  /**
   * 🔥 查询类命令
   */

  // 获取设备模式
  private getMode(): Buffer {
    return this.wrapCommand(`HUASI,GET,MODEL,${this.sncode}`);
  }

  // 读取设备数据
  private getData(): Buffer {
    return this.wrapCommand(`HUASI,GET,DATA,${this.sncode}`);
  }

  // 读取设备数据，分包形式
  private getMData(): Buffer {
    return this.wrapCommand(`HUASI,GET,MDATA,${this.sncode}`);
  }

  // 查询设备节点号
  private getNodes(): Buffer {
    return this.wrapCommand(`HUASI,GET,DEVICE,${this.sncode}`);
  }

  // 查询扭角
  private getTwist(): Buffer {
    return this.wrapCommand(`HUASI,GET,AZIMUTH,${this.sncode}`);
  }

  // 查询系统时间
  private getTime(): Buffer {
    return this.wrapCommand('HUASI,GET,DATE');
  }

  // 查询采样间隔，单位秒
  private getInterval(): Buffer {
    return this.wrapCommand('HUASI,GET,NODE,TIMER');
  }

  // 查询固件版本
  private getVersion(): Buffer {
    return this.wrapCommand('HUASI,GET,VERSION');
  }

  // 查询采集器挂载了哪些设备
  private getDevices(): Buffer {
    return this.wrapCommand('HUASI,GET,DEVICES');
  }

  // 查询设备门限值，因为拼写错误他们定的命令是GLIMINT
  private getGlimit(): Buffer {
    return this.wrapCommand(`HUASI,GET,GLIMINT,${this.sncode}`);
  }

  // 获取历史数据
  private getHistory({
    historyFrom, historyTo,
  }: {
    historyFrom?: number; historyTo?: number;
  }): Buffer {
    if (historyFrom === undefined || historyTo === undefined) {
      throw new Error('缺少必要参数');
    }
    const fromString = moment(historyFrom).format('YY,MM,DD,HH,mm,ss');
    const toString = moment(historyTo).format('YY,MM,DD,HH,mm,ss');
    return this.wrapCommand(`HUASI,GET,HISTORY,${this.sncode},${fromString},${toString}`);
  }

  /**
   * 🔥 设置类命令
   */

  // 重启记录器
  private reset(): Buffer {
    return this.wrapCommand('HUASI,SET,RESET');
  }

  // 保存配置
  private save(): Buffer {
    return this.wrapCommand('HUASI,SET,SAVE');
  }

  // 更新系统时间，同步当前时间
  private updateTime(): Buffer {
    const [YYYY, MM, DD, HH, mm, ss] = moment().format('YYYY,MM,DD,HH,mm,ss').split(',');
    const command = `HUASI,SET,DATE,${YYYY},${MM},${DD},${HH},${mm},${ss}`;
    return this.wrapCommand(command);
  }

  // 设置设备模式
  // calType 计算方式 [近线端0, 远线端1]
  // layType 布设方式 [水平0, 垂直1, 环形2]
  private setMode({
    calType, layType,
  }: {
    calType?: number;
    layType?: number;
  }): Buffer {
    if (calType === undefined || layType === undefined) {
      throw new Error('缺少必要参数');
    }

    if (![0, 1].includes(calType)) {
      throw new Error(`起算方式参数错误 ${calType}`);
    }

    if (![0, 1, 2].includes(layType)) {
      throw new Error(`布设方式参数错误 ${layType}`);
    }

    const command = `HUASI,SET,MODEL,${this.sncode},${calType},${layType}`;
    return this.wrapCommand(command);
  }

  // 设置采集器采集频率，目前不支持分设备设置
  private setInterval({
    interval,
  }: {
    interval?: number;
  }): Buffer {
    if (interval === undefined) {
      throw new Error('缺少必要参数');
    }
    const command = `HUASI,SET,NODE,TIMER,${interval}`;
    return this.wrapCommand(command);
  }

  /**
   * 设置节点扭角
   * param {[string, number][]} options.nodesTwist 各节点扭角
   * param {Number} options.initAzimuth 设备布设初始扭角
   */
  private setTwist({
    nodesTwist, initTwist = 0,
  }: ICmdOptions): Buffer {
    if (nodesTwist === undefined || initTwist === undefined) {
      throw new Error('缺少必要参数');
    }

    const list: string[] = [];
    nodesTwist.forEach(([nodeName, twist]) => {
      // 各节点扭角加上整根设备的初始扭角
      const angle = twist + initTwist;

      list.push(`${nodeName},${angle}`);
    });
    const command = `HUASI,SET,AZIMUTH,${this.sncode},${list.length},${list.join(',')}`;
    return this.wrapCommand(command);
  }

  /**
   * 查询数据上传模式
   */
  private getUploadMode(): Buffer {
    const command = `HUASI,GET,UPLOADMODEL,${this.sncode}`;
    return this.wrapCommand(command);
  }

  /**
   * 设置数据上传模式
   */
  private setUploadMode({
    uploadMode,
  }: ICmdOptions): Buffer {
    if (uploadMode === undefined) {
      throw new Error('缺少必要参数');
    }
    const command = `HUASI,SET,UPLOADMODEL,${this.sncode},${uploadMode}`;
    return this.wrapCommand(command);
  }

  /**
   * 设置门限值
   */
  private setGlimit({
    glimit,
  }: ICmdOptions): Buffer {
    if (glimit === undefined) {
      throw new Error('缺少必要参数');
    }
    let limit = glimit > 1 ? 1 : glimit;
    limit = limit < 0.0001 ? 0.0001 : limit;
    const command = `HUASI,SET,GLIMINT,${this.sncode},${limit}`;
    return this.wrapCommand(command);
  }

  /**
   * 关闭数据上传模式
   */
  private inactiveUploadMode(): Buffer {
    const command = `HUASI,SET,UPLOADMODEL,${this.sncode},0`;
    return this.wrapCommand(command);
  }

  /**
   * 打开MDATA上传模式
   */
  private activeMdataUploadMode(): Buffer {
    const command = `HUASI,SET,UPLOADMODEL,${this.sncode},1`;
    return this.wrapCommand(command);
  }

  /**
   * 打开TMDATA上传模式
   */
  private activeTmdataUploadMode(): Buffer {
    const command = `HUASI,SET,UPLOADMODEL,${this.sncode},2`;
    return this.wrapCommand(command);
  }

  /**
   * 打开DATA上传模式
   */
  private activeDataUploadMode(): Buffer {
    const command = `HUASI,SET,UPLOADMODEL,${this.sncode},3`;
    return this.wrapCommand(command);
  }

  /**
   * 回复OK响应，收到数据后回复
   */
  private ok(): Buffer {
    return this.wrapCommand('HUASI,OK');
  }

  /**
   * 重排节点
   */
  private updateNodes(): Buffer {
    return this.wrapCommand('HUASI,SET,GETCAL');
  }

  /**
   * 生成命令
   */
  public create(cmd: string, cmdOptions: ICmdOptions = {}): Buffer {
    switch (cmd) {
      case TxtCommands.GET_MODE:
        return this.getMode();
      case TxtCommands.GET_DATA:
        return this.getData();
      case TxtCommands.GET_MDATA:
        return this.getMData();
      case TxtCommands.GET_NODES:
        return this.getNodes();
      case TxtCommands.GET_TWIST:
        return this.getTwist();
      case TxtCommands.GET_TIME:
        return this.getTime();
      case TxtCommands.GET_INTERVAL:
        return this.getInterval();
      case TxtCommands.GET_VERSION:
        return this.getVersion();
      case TxtCommands.GET_DEVICES:
        return this.getDevices();
      case TxtCommands.RESET:
        return this.reset();
      case TxtCommands.SAVE:
        return this.save();
      case TxtCommands.UPDATE_TIME:
        return this.updateTime();
      case TxtCommands.SET_MODE:
        return this.setMode(cmdOptions);
      case TxtCommands.SET_INTERVAL:
        return this.setInterval(cmdOptions);
      case TxtCommands.SET_TWIST:
        return this.setTwist(cmdOptions);
      case TxtCommands.INACTIVE_UPLOAD:
        return this.inactiveUploadMode();
      case TxtCommands.ACTIVE_MDATA_UPLOAD:
        return this.activeMdataUploadMode();
      case TxtCommands.ACTIVE_TMDATA_UPLOAD:
        return this.activeTmdataUploadMode();
      case TxtCommands.ACTIVE_DATA_UPLOAD:
        return this.activeDataUploadMode();
      case TxtCommands.GET_UPLOAD_MODE:
        return this.getUploadMode();
      case TxtCommands.SET_UPLOAD_MODE:
        return this.setUploadMode(cmdOptions);
      case TxtCommands.OK:
        return this.ok();
      case TxtCommands.GET_GLIMIT:
        return this.getGlimit();
      case TxtCommands.SET_GLIMIT:
        return this.setGlimit(cmdOptions);
      case TxtCommands.GET_HISTORY:
        return this.getHistory(cmdOptions);
      case TxtCommands.UPDATE_NODES:
        return this.updateNodes();
      default:
        throw new Error(`错误的文本命令 ${cmd}`);
    }
  }
}
