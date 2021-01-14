/**
 * 计算校验和
 * @param {Buffer} buffer 命令体
 * @return {Buffer} 命令校验码
 */
export const checksum = (buffer: Buffer): Buffer => {
  const xor = Array.from(buffer).reduce((prev, cur) => prev ^ cur, 0);
  return Buffer.from([xor]);
};

/**
 * 校验和首字节的字符串形式
 * @param {Buffer} buffer 校验和
 * @return {String} 首字节的大写字符串
 */
export const firstByteString = (buffer: Buffer): string => {
  const firstByte = Array.from(buffer)[0];
  if (!firstByte) throw new Error('buffer is empty');
  let string = firstByte.toString(16);
  if (string.length === 1) {
    string = `0${string}`;
  }
  return string.toUpperCase();
};
