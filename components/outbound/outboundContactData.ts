// 外呼联系人演示数据，统一供联系单、任务配置和任务详情使用。
import { BotVariable, ContactFieldDefinition, ContactList, ContactRecord, TaskVariableMapping } from '../../types';

export const CONTACT_FIELDS: ContactFieldDefinition[] = [
  { id: 'field_name', key: 'customer_name', name: '客户姓名', type: 'TEXT', required: true, system: true },
  { id: 'field_phone', key: 'phone_number', name: '手机号码', type: 'PHONE', required: true, system: true },
  { id: 'field_nickname', key: 'customer_nickname', name: '客户昵称', type: 'TEXT' },
  { id: 'field_gender', key: 'customer_gender', name: '客户性别', type: 'TEXT' },
  { id: 'field_age', key: 'customer_age', name: '客户年龄', type: 'NUMBER' },
  { id: 'field_city', key: 'customer_city', name: '所在城市', type: 'TEXT' },
  { id: 'field_level', key: 'customer_level', name: '客户等级', type: 'TEXT' },
];

export const BOT_INPUT_VARIABLES: BotVariable[] = [
  { id: 'input_nickname', name: 'customer_nickname', type: 'TEXT', description: '客户称呼，用于开场白和话术', isSystem: false, category: 'INPUT', source: 'user_input', required: true, usageScopes: ['prompt', 'opening', 'flow'] },
  { id: 'input_gender', name: 'customer_gender', type: 'TEXT', description: '客户性别，用于选择合适称谓', isSystem: false, category: 'INPUT', source: 'user_input', required: false, defaultValue: '未知', usageScopes: ['prompt', 'flow'] },
  { id: 'input_age', name: 'customer_age', type: 'NUMBER', description: '客户年龄，用于匹配业务规则', isSystem: false, category: 'INPUT', source: 'user_input', required: false, usageScopes: ['prompt', 'flow', 'tool'] },
];

const makeRecord = (
  id: string,
  contactListId: string,
  customerName: string,
  phoneNumber: string,
  nickname: string,
  gender: string,
  age: number,
  city: string,
  level: string,
  status: ContactRecord['status'] = 'pending',
): ContactRecord => ({
  id,
  contactListId,
  customerName,
  phoneNumber,
  status,
  values: {
    customer_nickname: nickname,
    customer_gender: gender,
    customer_age: age,
    customer_city: city,
    customer_level: level,
  },
});

const SHANGHAI_RECORDS: ContactRecord[] = [
  makeRecord('C-10001', '1', '张欣', '138****8001', '欣姐', '女', 32, '上海', 'A', 'completed'),
  makeRecord('C-10002', '1', '王建国', '139****1826', '王先生', '男', 45, '上海', 'B', 'calling'),
  makeRecord('C-10003', '1', '陈晓雨', '186****2735', '小雨', '女', 28, '苏州', 'A'),
  makeRecord('C-10004', '1', '林峰', '158****5120', '林先生', '男', 39, '上海', 'C'),
  makeRecord('C-10005', '1', '赵敏', '177****9088', '赵女士', '女', 36, '杭州', 'B'),
];

const BEIJING_RECORDS: ContactRecord[] = [
  makeRecord('C-20001', '2', '刘伟', '136****2201', '刘先生', '男', 41, '北京', 'A'),
  makeRecord('C-20002', '2', '周琳', '135****7632', '琳琳', '女', 30, '北京', 'B'),
  makeRecord('C-20003', '2', '孙浩', '188****6127', '孙先生', '男', 34, '天津', 'A'),
];

export const OUTBOUND_CONTACT_LISTS: ContactList[] = [
  {
    id: '1', name: '上海地区高意向客户_20240520', totalCount: 1200, validCount: 1180, status: 'running', createdAt: 1716182400000,
    priority: 1, executedCount: 358, connectedCount: 226, seatAnsweredCount: 0, retryCount: 42, successRate: '63.1%',
    fieldDefinitions: CONTACT_FIELDS, records: SHANGHAI_RECORDS,
  },
  {
    id: '2', name: '北京车展留资名单', totalCount: 500, validCount: 485, status: 'ready', createdAt: 1716096000000,
    priority: 1, fieldDefinitions: CONTACT_FIELDS, records: BEIJING_RECORDS,
  },
  {
    id: '3', name: '官网咨询未接通回访', totalCount: 120, validCount: 120, status: 'ready', createdAt: 1716009600000,
    priority: 1, fieldDefinitions: CONTACT_FIELDS, records: SHANGHAI_RECORDS.map((record) => ({ ...record, id: `R-${record.id}`, contactListId: '3' })),
  },
];

export const createDefaultMappings = (contactListIds: string[]): TaskVariableMapping[] =>
  contactListIds.flatMap((contactListId) => BOT_INPUT_VARIABLES.map((variable) => ({
    contactListId,
    variableName: variable.name,
    sourceFieldKey: variable.name,
    defaultValue: variable.defaultValue,
  })));

export const getContactFieldValue = (record: ContactRecord, key: string): string => {
  if (key === 'customer_name') return record.customerName;
  if (key === 'phone_number') return record.phoneNumber;
  const value = record.values[key];
  return value === null || value === undefined || value === '' ? '-' : String(value);
};
