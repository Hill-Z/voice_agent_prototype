// 报表导出的 CSV 生成与下载。这里只有纯函数与一次浏览器下载调用，不含任何界面，
// 因为导出物是给客户拿去做账的：同一份数据导出两次必须一模一样，跟屏幕上当时怎么排、
// 分了几页、有没有展开某一格都无关。
//
// 三条口径写在这里而不是靠调用方记得：
//   一、带 BOM、CRLF —— 不带 BOM 的中文 CSV 用 Excel 打开是乱码，客户会以为导出坏了；
//   二、数字不带千分位、不带货币符号 —— 带逗号的「42,689.74」在 CSV 里会被切成两列；
//   三、公式注入防护 —— 以 = + @ 开头的单元格 Excel 会当公式执行，导出的是别人的数据，
//       不能让它在客户电脑上跑起来。

// 单元格转义。含逗号、引号、换行时必须整体加引号，内部的引号翻倍——这是 CSV 的规矩，
// 少做一步，一个带逗号的机器人名就能把整张表的列错开。
const csvCell = (value: string): string => {
  // 「-」这一支要分两种：负数金额（-1.00、-42689.74）必须原样留着，
  // 加了撇号 Excel 就当文本，一列金额求和全是 0；而 -1+1 是公式，得拦。
  // 判据是「整个值是不是一个合法的负数」，不是「- 后面跟的是不是数字」——
  // 后者的正则写出来正是 -1+1 这种能溜过去的样子。
  const negativeNumber = /^-\d+(\.\d+)?$/;
  const risky =
    /^[=+@]/.test(value)
    || (value.startsWith('-') && !negativeNumber.test(value))
    || /^[\t\r]/.test(value);
  const body = risky ? `'${value}` : value;
  const needsQuote = /[",\r\n]/.test(body);
  return needsQuote ? `"${body.replace(/"/g, '""')}"` : body;
};

// 表头 + 数据行 → 一份完整的 CSV 文本。行尾用 CRLF：Excel 与大多数账务工具都认，
// 只给 LF 时 Windows 上的记事本会显示成一行。
export const toCsv = (headers: string[], rows: string[][]): string =>
  `﻿${[headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;

// 金额转成导出用的字符串：元、两位小数、不带千分位、不带「¥」。
// 页面上写「¥42,689.74」是给人读的，导出物是给工具读的，两者不能混。
export const csvYuan = (cents: number): string => (cents / 100).toFixed(2);

// 时长统一导出成分钟（两位小数）。不导出「3 分 49 秒」这种给人读的写法：
// 客户拿回去要能直接求和、能除单价。
export const csvMinutes = (seconds: number): string => (seconds / 60).toFixed(2);

// 单次导出的时间跨度上限。上限不是技术限制，是业务限制：一次导出三个月以上，
// 客户多半是想要一份「历史全量」，那应该走定时的账期报表而不是点一次导出。
export const EXPORT_MAX_MONTHS = 3;

// 两个日期之间的自然月跨度（含首尾所在的月）。用来判断一次导出会不会超上限。
export const monthSpan = (from: string, to: string): number =>
  (Number(to.slice(0, 4)) - Number(from.slice(0, 4))) * 12 + (Number(to.slice(5, 7)) - Number(from.slice(5, 7))) + 1;

// 文件名：报表名 + 账户 + 范围 + 导出时刻。带上这三样，客户下载十个文件之后
// 还能从文件名看出哪一份是哪一份；同名文件被系统自动加「(1)」时也不会张冠李戴。
export const exportFileName = (reportName: string, accountName: string, from: string, to: string, at: string): string =>
  `${reportName}_${accountName}_${from}_${to}_${at.slice(11).replace(/:/g, '')}.csv`;

// 触发浏览器下载。用 Blob + a[download] 而不是跳转到一个 URL：
// 原生原型没有下载接口，而这个入口的真实行为就是「点一下，文件落到本地」。
export const downloadCsv = (fileName: string, csv: string): void => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // 立即回收会让部分浏览器来不及读取，交给下一个事件循环。
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
