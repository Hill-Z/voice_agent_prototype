// 本地开发入口，同时启动主系统和操作手册，并在退出时统一关闭两个服务。
import {spawn} from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const appArguments = process.argv.slice(2);
const childProcesses = [];
let isShuttingDown = false;

// 启动一个可在当前窗口查看日志的开发服务。
const startService = (scriptName, extraArguments = []) => {
  const childProcess = spawn(
    npmCommand,
    ['run', scriptName, ...extraArguments],
    {stdio: 'inherit'},
  );

  childProcesses.push(childProcess);
  return childProcess;
};

// 任一服务退出时关闭另一服务，避免后台残留进程占用端口。
const stopAllServices = (exitCode = 0) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  for (const childProcess of childProcesses) {
    if (!childProcess.killed) {
      childProcess.kill('SIGTERM');
    }
  }
  process.exitCode = exitCode;
};

const docsService = startService('dev:docs');
const appService = startService(
  'dev:app',
  appArguments.length > 0 ? ['--', ...appArguments] : [],
);

// 监听服务异常，向使用者显示明确错误并退出。
for (const service of [docsService, appService]) {
  service.on('error', (error) => {
    console.error(`本地开发服务启动失败：${error.message}`);
    stopAllServices(1);
  });
  service.on('exit', (code, signal) => {
    if (!isShuttingDown) {
      const reason = signal ? `信号 ${signal}` : `退出码 ${code ?? 0}`;
      console.error(`本地开发服务已停止（${reason}）。`);
      stopAllServices(code ?? 0);
    }
  });
}

process.on('SIGINT', () => stopAllServices(0));
process.on('SIGTERM', () => stopAllServices(0));
