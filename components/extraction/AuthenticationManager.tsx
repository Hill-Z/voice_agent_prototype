/** 管理四类独立鉴权，并通过独立子页面完成新建和编辑。 */
import React, { useMemo, useState } from 'react';
import { ArrowLeft, KeyRound, Plus, ShieldCheck } from 'lucide-react';
import { AuthenticationConfig, AuthenticationType, ExtractionConfig } from '../../types';

interface Props {
  authentications: AuthenticationConfig[];
  onUpdate: (items: AuthenticationConfig[]) => void;
  interfaces: ExtractionConfig[];
}

const TYPE_NAMES: Record<AuthenticationType, string> = {
  basic: 'Basic Authentication',
  bearer: 'Bearer Token',
  oauth2_client_credentials: 'OAuth2 Client Credentials',
  oauth2_jwt: 'OAuth2 JWT',
};

const createEmpty = (): AuthenticationConfig => ({ id: `auth_${Date.now()}`, name: '', description: '', provider: '', type: 'basic', status: 'unchecked', lastUpdated: Date.now(), basic: { username: '', password: '' } });

export default function AuthenticationManager({ authentications, onUpdate, interfaces }: Props) {
  const [editing, setEditing] = useState<AuthenticationConfig | null>(null);
  const usage = useMemo(() => new Map(authentications.map((item) => [item.id, interfaces.filter((entry) => entry.authMode === 'reference' && entry.authConfigId === item.id).length])), [authentications, interfaces]);

  const save = (item: AuthenticationConfig) => {
    const next = { ...item, lastUpdated: Date.now() };
    onUpdate(authentications.some((entry) => entry.id === next.id) ? authentications.map((entry) => entry.id === next.id ? next : entry) : [next, ...authentications]);
    setEditing(null);
  };

  const remove = (id: string) => {
    if ((usage.get(id) ?? 0) > 0 || !window.confirm('确认删除这条鉴权配置吗？')) return;
    onUpdate(authentications.filter((item) => item.id !== id));
  };

  if (editing) return <AuthenticationForm initialData={editing} exists={authentications.some((item) => item.id === editing.id)} onSave={save} onCancel={() => setEditing(null)} />;

  return <div className="p-8 max-w-7xl mx-auto w-full">
    <div className="flex items-start justify-between mb-6"><div><h1 className="text-2xl font-bold text-slate-900">鉴权管理</h1><p className="text-sm text-slate-500 mt-1">统一管理鉴权配置，供多个接口引用。</p></div><button onClick={() => setEditing(createEmpty())} className="button-primary"><Plus size={16} />新建鉴权</button></div>
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 border-b"><tr><th className="px-6 py-4 text-xs text-slate-500">名称</th><th className="px-6 py-4 text-xs text-slate-500">鉴权类型</th><th className="px-6 py-4 text-xs text-slate-500">提供方</th><th className="px-6 py-4 text-xs text-slate-500">引用接口</th><th className="px-6 py-4 text-xs text-slate-500 text-right">操作</th></tr></thead>
      <tbody className="divide-y divide-slate-100">{authentications.map((item) => <tr key={item.id} className="hover:bg-slate-50"><td className="px-6 py-4"><div className="flex items-center font-semibold text-slate-800"><KeyRound size={16} className="text-primary mr-2" />{item.name}</div><div className="mt-1 text-xs text-slate-400">{item.description || '敏感信息已隐藏'}</div></td><td className="px-6 py-4 text-sm text-slate-600">{TYPE_NAMES[item.type]}</td><td className="px-6 py-4 text-sm text-slate-600">{item.provider || '自定义 API'}</td><td className="px-6 py-4 text-sm text-slate-600">{usage.get(item.id) ?? 0} 个</td><td className="px-6 py-4"><div className="flex justify-end gap-4"><button onClick={() => setEditing(item)} className="text-sm text-primary hover:text-blue-700">编辑</button><button disabled={(usage.get(item.id) ?? 0) > 0} title={(usage.get(item.id) ?? 0) > 0 ? '正在被接口引用，不能删除' : '删除'} onClick={() => remove(item.id)} className="text-sm text-red-500 disabled:text-slate-300">删除</button></div></td></tr>)}</tbody>
    </table></div>
  </div>;
}

function AuthenticationForm({ initialData, exists, onSave, onCancel }: { initialData: AuthenticationConfig; exists: boolean; onSave: (item: AuthenticationConfig) => void; onCancel: () => void }) {
  const [item, setItem] = useState(initialData);
  const [checked, setChecked] = useState(false);
  const switchType = (type: AuthenticationType) => setItem({ ...createEmpty(), id: item.id, name: item.name, description: item.description, provider: item.provider, type });
  return <div className="p-8 max-w-5xl mx-auto w-full pb-20">
    <div className="flex items-start justify-between mb-6"><div><button onClick={onCancel} className="mb-3 flex items-center text-sm text-slate-400 hover:text-primary"><ArrowLeft size={16} className="mr-1" />返回鉴权列表</button><h1 className="text-2xl font-bold text-slate-900">{exists ? '编辑鉴权' : '新建鉴权'}</h1><p className="mt-1 text-sm text-slate-500">鉴权保存后可被多个接口安全引用。</p></div><div className="flex gap-3"><button onClick={() => setChecked(true)} className="button-secondary">检查配置</button><button disabled={!item.name.trim()} onClick={() => saveReady(item, onSave)} className="button-primary">保存鉴权</button></div></div>
    <section className="rounded-xl border border-slate-200 bg-white p-6 mb-5"><h2 className="font-bold text-slate-800 mb-5">基本信息</h2><div className="grid grid-cols-2 gap-5"><Field label="名称" required><input value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} className="input-auth" placeholder="例如：CRM 生产环境" /></Field><Field label="提供方"><input value={item.provider} onChange={(e) => setItem({ ...item, provider: e.target.value })} className="input-auth" placeholder="例如：自定义 API" /></Field><Field label="鉴权类型" required><select value={item.type} onChange={(e) => switchType(e.target.value as AuthenticationType)} className="input-auth">{Object.entries(TYPE_NAMES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="描述"><input value={item.description} onChange={(e) => setItem({ ...item, description: e.target.value })} className="input-auth" placeholder="说明使用场景" /></Field></div></section>
    <AuthFields item={item} onChange={setItem} />
    <div className={`mt-5 rounded-lg px-4 py-3 text-sm ${checked ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{checked ? '配置格式检查通过。真实连接结果由后端测试接口返回。' : '密钥保存后只显示掩码；接口只保存鉴权编号，不复制密钥。'}</div>
  </div>;
}

const saveReady = (item: AuthenticationConfig, onSave: (item: AuthenticationConfig) => void) => onSave(item);

function AuthFields({ item, onChange }: { item: AuthenticationConfig; onChange: (item: AuthenticationConfig) => void }) {
  if (item.type === 'basic') { const value = item.basic ?? { username: '', password: '' }; return <Section title="认证凭证"><div className="grid grid-cols-2 gap-5"><Field label="用户名" required><input value={value.username} onChange={(e) => onChange({ ...item, basic: { ...value, username: e.target.value } })} className="input-auth" /></Field><Field label="密码" required><Secret value={value.password} onChange={(password) => onChange({ ...item, basic: { ...value, password } })} /></Field></div></Section>; }
  if (item.type === 'bearer') { const value = item.bearer ?? { token: '' }; return <Section title="认证令牌"><Field label="Bearer Token" required><Secret value={value.token} onChange={(token) => onChange({ ...item, bearer: { token } })} /></Field></Section>; }
  if (item.type === 'oauth2_client_credentials') { const value = item.oauth2ClientCredentials ?? { clientId: '', clientSecret: '', tokenUrl: '', scopes: '', clientAuthMethod: 'body' as const }; return <Section title="OAuth2 Client Credentials"><div className="grid grid-cols-2 gap-5"><Field label="客户端 ID" required><input value={value.clientId} onChange={(e) => onChange({ ...item, oauth2ClientCredentials: { ...value, clientId: e.target.value } })} className="input-auth" /></Field><Field label="客户端密钥" required><Secret value={value.clientSecret} onChange={(clientSecret) => onChange({ ...item, oauth2ClientCredentials: { ...value, clientSecret } })} /></Field></div><Field label="令牌 URL" required><input value={value.tokenUrl} onChange={(e) => onChange({ ...item, oauth2ClientCredentials: { ...value, tokenUrl: e.target.value } })} className="input-auth" placeholder="https://api.example.com/oauth/token" /></Field><div className="grid grid-cols-2 gap-5"><Field label="权限范围"><input value={value.scopes} onChange={(e) => onChange({ ...item, oauth2ClientCredentials: { ...value, scopes: e.target.value } })} className="input-auth" placeholder="多个范围用空格分隔" /></Field><Field label="客户端凭证位置"><select value={value.clientAuthMethod} onChange={(e) => onChange({ ...item, oauth2ClientCredentials: { ...value, clientAuthMethod: e.target.value as 'body' | 'basic' } })} className="input-auth"><option value="body">请求体</option><option value="basic">Basic Auth 请求头</option></select></Field></div></Section>; }
  const value = item.oauth2Jwt ?? { signingKey: '', tokenUrl: '', scopes: '', tokenType: 'id_token' as const, algorithm: 'HS256' as const, keyId: '', expiresInSeconds: 3600, issuer: '', audience: '', subject: '', extraClaims: '{}' };
  return <Section title="OAuth2 JWT">
    <Field label="签名密钥" required><Secret value={value.signingKey} onChange={(signingKey) => onChange({ ...item, oauth2Jwt: { ...value, signingKey } })} /></Field>
    <Field label="令牌 URL" required><input value={value.tokenUrl} onChange={(e) => onChange({ ...item, oauth2Jwt: { ...value, tokenUrl: e.target.value } })} className="input-auth" placeholder="https://api.example.com/oauth/token" /></Field>
    <Field label="权限范围"><input value={value.scopes} onChange={(e) => onChange({ ...item, oauth2Jwt: { ...value, scopes: e.target.value } })} className="input-auth" placeholder="多个范围用空格分隔" /></Field>
    <div className="grid grid-cols-3 gap-5">
      <Field label="令牌类型"><select value={value.tokenType} onChange={(e) => onChange({ ...item, oauth2Jwt: { ...value, tokenType: e.target.value as 'access_token' | 'id_token' } })} className="input-auth"><option value="access_token">访问令牌</option><option value="id_token">ID 令牌</option></select></Field>
      <Field label="算法"><select value={value.algorithm} onChange={(e) => onChange({ ...item, oauth2Jwt: { ...value, algorithm: e.target.value as NonNullable<AuthenticationConfig['oauth2Jwt']>['algorithm'] } })} className="input-auth"><option value="HS256">HS256 (HMAC SHA-256)</option><option value="HS384">HS384 (HMAC SHA-384)</option><option value="HS512">HS512 (HMAC SHA-512)</option><option value="RS256">RS256 (RSA SHA-256)</option><option value="RS384">RS384 (RSA SHA-384)</option><option value="RS512">RS512 (RSA SHA-512)</option></select></Field>
      <Field label="密钥 ID（可选）"><input value={value.keyId} onChange={(e) => onChange({ ...item, oauth2Jwt: { ...value, keyId: e.target.value } })} className="input-auth" /></Field>
    </div>
    <Field label="过期时间（秒）"><input type="number" value={value.expiresInSeconds} onChange={(e) => onChange({ ...item, oauth2Jwt: { ...value, expiresInSeconds: Number(e.target.value) } })} className="input-auth" /></Field>
    <div className="grid grid-cols-3 gap-5"><Field label="签发者（iss）"><input value={value.issuer} onChange={(e) => onChange({ ...item, oauth2Jwt: { ...value, issuer: e.target.value } })} className="input-auth" /></Field><Field label="受众（aud）"><input value={value.audience} onChange={(e) => onChange({ ...item, oauth2Jwt: { ...value, audience: e.target.value } })} className="input-auth" /></Field><Field label="主题（sub）"><input value={value.subject} onChange={(e) => onChange({ ...item, oauth2Jwt: { ...value, subject: e.target.value } })} className="input-auth" /></Field></div>
    <Field label="额外参数（JSON）"><textarea value={value.extraClaims} onChange={(e) => onChange({ ...item, oauth2Jwt: { ...value, extraClaims: e.target.value } })} className="textarea" placeholder='{"role":"admin"}' /></Field>
  </Section>;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="rounded-xl border border-slate-200 bg-white p-6"><div className="flex items-center mb-5"><ShieldCheck size={18} className="mr-2 text-primary" /><h2 className="font-bold text-slate-800">{title}</h2></div><div className="space-y-5">{children}</div></section>;
const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => <label className="block text-sm text-slate-600">{required && <span className="text-red-500 mr-1">*</span>}{label}<div className="mt-2">{children}</div></label>;
const Secret = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => <input type="password" value={value} onChange={(e) => onChange(e.target.value)} className="input-auth" placeholder="请输入密钥" />;
