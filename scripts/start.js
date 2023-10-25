'use strict';

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

// Ensure environment variables are read.
require('../config/env');

const fs = require('fs');
// react-dev-utils 积累了很多有用的功能
const chalk = require('react-dev-utils/chalk');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const clearConsole = require('react-dev-utils/clearConsole');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const {
  choosePort,
  createCompiler,
  prepareProxy,
  prepareUrls,
} = require('react-dev-utils/WebpackDevServerUtils');
const openBrowser = require('react-dev-utils/openBrowser');
const semver = require('semver');
const paths = require('../config/paths');
const configFactory = require('../config/webpack.config');
const createDevServerConfig = require('../config/webpackDevServer.config');
const getClientEnvironment = require('../config/env');
const react = require(require.resolve('react', { paths: [paths.appPath] }));

const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));
const useYarn = fs.existsSync(paths.yarnLockFile);
const isInteractive = process.stdout.isTTY;

// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1);
}

// Tools like Cloud9 rely on this.
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

if (process.env.HOST) {
  console.log(
    chalk.cyan(
      `Attempting to bind to HOST environment variable: ${chalk.yellow(
        chalk.bold(process.env.HOST)
      )}`
    )
  );
  console.log(
    `If this was unintentional, check that you haven't mistakenly set it in your shell.`
  );
  console.log(
    `Learn more here: ${chalk.yellow('https://cra.link/advanced-config')}`
  );
  console.log();
}

// We require that you explicitly set browsers and do not fall back to
// browserslist defaults.
const { checkBrowsers } = require('react-dev-utils/browsersHelper');
/**
 * paths.appPath: /Users/shishen/data/react-sourceCodeDebug
 * isInteractive: true
 * checkBrowsers(paths.appPath, isInteractive)
 * Promise {
    [
      'last 1 chrome version',
      'last 1 firefox version',
      'last 1 safari version'
    ]
  }
 */
checkBrowsers(paths.appPath, isInteractive)
  .then(() => {
    // We attempt to use the default port but if it is busy, we offer the user to
    // run on a different port. `choosePort()` Promise resolves to the next free port.
    return choosePort(HOST, DEFAULT_PORT);
  })
  .then(port => {
    if (port == null) {
      // We have not found a port.
      return;
    }
    // port 3000

    // webpack的常用配置
    const config = configFactory('development');
    const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
    const appName = require(paths.appPackageJson).name;

    const useTypeScript = fs.existsSync(paths.appTsConfig);
    const urls = prepareUrls(
      protocol,
      HOST,
      port,
      paths.publicUrlOrPath.slice(0, -1)
    );
    /**
     * url 
     * {
        lanUrlForConfig: '172.18.63.95',
        lanUrlForTerminal: 'http://172.18.63.95:\x1B[1m3000\x1B[22m',
        localUrlForTerminal: 'http://localhost:\x1B[1m3000\x1B[22m',
        localUrlForBrowser: 'http://localhost:3000'
      }
     */
    // 创建webpack编译
    const compiler = createCompiler({
      appName,
      config,
      urls,
      useYarn,
      useTypeScript,
      webpack,
    });
    // 加载代理配置, 这里没有设置代理
    const proxySetting = require(paths.appPackageJson).proxy;
    const proxyConfig = prepareProxy(
      proxySetting,
      paths.appPublic,
      paths.publicUrlOrPath
    );
    // 通过webserver提供的编译器生成webpack资源
    const serverConfig = {
      ...createDevServerConfig(proxyConfig, urls.lanUrlForConfig),
      host: HOST,
      port,
    };
    const devServer = new WebpackDevServer(serverConfig, compiler);
    // 启动 WebpackDevServer.
    devServer.startCallback(() => {
      // 为交互式 清空console
      if (isInteractive) {
        clearConsole();
      }
      
      // semver 版本号管理规范 查看版本
      if (env.raw.FAST_REFRESH && semver.lt(react.version, '16.10.0')) {
        console.log(
          chalk.yellow(
            `Fast Refresh requires React 16.10 or higher. You are using React ${react.version}.`
          )
        );
      }

      console.log(chalk.cyan('Starting the development server...\n'));
      // 打开浏览器
      openBrowser(urls.localUrlForBrowser);
    });

    // SIGINT 和 SIGTERM 是操作系统中用于发送信号（signal）给进程的两个常见信号
    // SIGINT（中断信号） 比如在终端按下 ctrl c 表示中断
    // SIGTERM（终止信号） 由系统或其他进程给进程发送的终止信号
    ['SIGINT', 'SIGTERM'].forEach(function (sig) {
      process.on(sig, function () {
        // 此时关闭dev, 并退出
        devServer.close();
        process.exit();
      });
    });

    if (process.env.CI !== 'true') {
      // 当标准输入(stdin)结束时，优雅地退出。
      process.stdin.on('end', function () {
        devServer.close();
        process.exit();
      });
    }
  })
  .catch(err => {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  });
