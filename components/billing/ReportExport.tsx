// 计费中心 · 报表导出：五张报表的字段口径与下载入口，以及每一次导出的留痕。
// 两件事必须同时做到，缺一样客户就不敢用：
//   一、每一列是什么、怎么算出来的，写在客户看得见的地方——对不上账时他得能自己查；
//   二、每一次导出都留一条记录（谁、什么时候、哪张表、什么范围、多少行），
//       账务数据出域必须有痕，这是审计要求，也是客户内部的合规要求。
import React, { useMemo, useState } from 'react';
import { AlertTriangle, Download, FileDown } from 'lucide-react';
import { ACCOUNT_NAME, DATA_CUTOFF_LABEL } from './billingData';
import {
  EXPORT_MAX_MONTHS,
  downloadCsv,
  exportFileName,
  monthSpan,
  toCsv,
} from './billingCsv';
import {
  REPORT_DEFINITIONS,
  formatSampleValue,
  sampleRow,
  type ReportDefinition,
} from './billingReports';
import { EmptyTableState } from '../report/reportUi';
import { Note, Panel, TD, TH, num } from './billingUi';

// 导出权限按角色控制：只有计费管理员能导出。原型没有登录态，所以这里是当前账号的角色。
const EXPORT_ROLE = '计费管理员';

// 一次导出的留痕。id 按本次会话内的顺序编号——原型不连服务端，编号不做跨会话唯一。
interface ExportRecord {
  id: string;
  reportName: string;
  rangeFrom: string;
  rangeTo: string;
  rowCount: number;
  fieldCount: number;
  fileName: string;
  exportedAt: string;
  operator: string;
}

const pad2 = (value: number): string => String(value).padStart(2, '0');

// 导出时刻取真实时间：导出是客户此刻做的事，不是一个演示数据里的日期。
// 页面别处用数据截止日当「今天」，是为了让「本月」落在演示数据里；
// 这里要记的是「这份文件什么时候出去的」，用假日期反而是错的。
const nowStamp = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
};

interface Props {
  // 导出范围跟随页面顶部那一个控件：同一屏上两个范围各说各的，客户不知道哪个才算数。
  from: string;
  to: string;
}

const ReportExport: React.FC<Props> = ({ from, to }) => {
  const [activeId, setActiveId] = useState<ReportDefinition['id']>(REPORT_DEFINITIONS[0].id);
  const [records, setRecords] = useState<ExportRecord[]>([]);
  const [blocked, setBlocked] = useState<string | null>(null);

  // 每张报表在范围内的行数与示例行都只算一次：口径表里的示例与下载的文件必须来自同一批行。
  const prepared = useMemo(
    () => REPORT_DEFINITIONS.map((definition) => {
      const rows = definition.rows(from, to);
      return { definition, rows, sample: sampleRow(rows) };
    }),
    [from, to],
  );

  const active = prepared.find((item) => item.definition.id === activeId) ?? prepared[0];
  const span = monthSpan(from, to);
  const tooWide = span > EXPORT_MAX_MONTHS;

  const handleExport = (definition: ReportDefinition, rows: string[][]) => {
    if (tooWide) {
      // 拦在下载之前，而不是让客户下一个空文件或者一个和范围对不上的文件。
      setBlocked(`所选范围跨 ${span} 个月，超过单次最多 ${EXPORT_MAX_MONTHS} 个月的限制。请把时间范围收窄后再导出，或按季度分几次导出。`);
      return;
    }
    setBlocked(null);
    const exportedAt = nowStamp();
    const fileName = exportFileName(definition.filePrefix, ACCOUNT_NAME, from, to, exportedAt);
    downloadCsv(fileName, toCsv(definition.fields.map((field) => field.name), rows));
    setRecords((prev) => [
      {
        id: `exp_${String(prev.length + 1).padStart(4, '0')}`,
        reportName: definition.name,
        rangeFrom: from,
        rangeTo: to,
        rowCount: rows.length,
        fieldCount: definition.fields.length,
        fileName,
        exportedAt,
        operator: `${ACCOUNT_NAME} · ${EXPORT_ROLE}`,
      },
      ...prev,
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-700 shadow-sm">
        <span>导出时间：<strong className="text-slate-900">{from} 至 {to}</strong></span>
        <span className="text-xs text-slate-500">CSV 文件 · 单次最多 {EXPORT_MAX_MONTHS} 个月 · {EXPORT_ROLE}</span>
        {tooWide && (
          <div className="flex w-full items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs leading-5 text-amber-800">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
            <span>当前选中 {span} 个月。请把顶部时间范围缩小到 {EXPORT_MAX_MONTHS} 个月以内再下载。</span>
          </div>
        )}
      </div>

      <Panel
        title="选择要下载的记录"
        desc="按你选择的时间导出；提醒记录包含全部历史发送凭证。"
        extra={<span className="text-xs text-slate-500">数据截止 {DATA_CUTOFF_LABEL}</span>}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {prepared.map(({ definition, rows }) => (
            <div key={definition.id} className="flex min-h-[148px] flex-col rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-900">{definition.name}</h4>
                <span className="whitespace-nowrap text-xs text-slate-500">{num(rows.length)} 条</span>
              </div>
              <p className="mt-2 flex-1 text-xs leading-5 text-slate-600">{definition.desc}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <button type="button" onClick={() => setActiveId(definition.id)} className="text-xs text-slate-500 underline-offset-2 hover:text-primary hover:underline">查看导出字段</button>
                <button type="button" onClick={() => handleExport(definition, rows)} disabled={tooWide || rows.length === 0} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">
                  <Download size={13} aria-hidden />下载 CSV
                </button>
              </div>
            </div>
          ))}
        </div>
        {blocked && (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{blocked}</p>
        )}
      </Panel>

      <Panel
        title="导出字段"
        desc="核对每列的含义和取值示例。"
        extra={
          <label className="flex items-center gap-2">
            <span className="text-xs text-slate-500">报表</span>
            <select
              className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700"
              value={activeId}
              onChange={(event) => setActiveId(event.target.value as ReportDefinition['id'])}
            >
              {REPORT_DEFINITIONS.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="border-b border-slate-200">
              <tr>
                <TH>字段</TH><TH>单位</TH><TH>含义</TH>
                <TH>计算口径</TH><TH>示例</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {active.definition.fields.map((field, index) => (
                <tr key={field.name}>
                  <TD className="font-medium text-slate-900">{field.name}</TD>
                  <TD className="text-slate-600">{field.unit}</TD>
                  <TD className="text-xs text-slate-600">{field.meaning}</TD>
                  <TD className="text-xs text-slate-500">{field.note ?? '—'}</TD>
                  {/* 示例取范围内第一行的真实值，不手写：手写的示例改了字段忘了改，
                      这张口径表就成了一份假文档，而客户是照着它去对账的。 */}
                  <TD className="font-mono text-xs text-slate-700">
                    {active.sample === null ? '（范围内没有数据）' : formatSampleValue(active.sample[index] ?? '', field.unit)}
                  </TD>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50">
              <tr>
                <td colSpan={5} className="px-3 py-3 text-xs text-slate-500">
                  共 {active.definition.fields.length} 个字段 · 示例取本次导出范围内第一条记录
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <Note>
          未接通与待定价的通话在「通话时长」「适用费率」「本通费用」三列留空而不是写 0——
          写 0 会被读成「这通免费」，实际是「暂不扣费、定价后补扣」。
        </Note>
      </Panel>

      <Panel
        title="导出记录（本次会话）"
        desc="每次导出都留一条：谁导的、什么时候、导了哪张表。"
        extra={<span className="inline-flex items-center gap-1 text-xs text-slate-400"><FileDown size={13} aria-hidden />账务数据出域必须留痕</span>}
      >
        {records.length === 0 ? (
          <EmptyTableState
            title="本次会话还没有导出过"
            desc="在上面点「下载 CSV」之后，这里会新增一行：报表名、时间范围、行数、文件名、导出时刻与操作人。"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="border-b border-slate-200">
                <tr>
                  <TH>记录号</TH><TH>导出时刻</TH><TH>报表</TH><TH>时间范围</TH>
                  <TH>行数</TH><TH>字段数</TH><TH>操作人</TH><TH>文件名</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((item) => (
                  <tr key={item.id}>
                    <TD className="font-mono text-xs text-slate-500">{item.id}</TD>
                    <TD>{item.exportedAt}</TD>
                    <TD className="font-medium text-slate-900">{item.reportName}</TD>
                    <TD className="text-slate-600">{item.rangeFrom} ~ {item.rangeTo}</TD>
                    <TD>{num(item.rowCount)}</TD>
                    <TD>{item.fieldCount}</TD>
                    <TD className="text-slate-600">{item.operator}</TD>
                    <TD className="font-mono text-xs text-slate-500">{item.fileName}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Note>
          刷新页面就清空（原型不连服务端）；正式环境长期保留，与「通知记录」一样可回查。
        </Note>
      </Panel>
    </div>
  );
};

export default ReportExport;
