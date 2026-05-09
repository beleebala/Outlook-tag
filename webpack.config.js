const CopyWebpackPlugin = require("copy-webpack-plugin");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

const DEFAULT_DEV_URL = "https://localhost:4000";
const DEFAULT_PROD_URL = "https://beleebala.github.io/Outlook-tag";

module.exports = async (_env, argv) => {
  const isProduction = argv.mode === "production";
  const assetUrl = (process.env.ASSET_URL || (isProduction ? DEFAULT_PROD_URL : DEFAULT_DEV_URL)).replace(/\/$/, "");
  const httpsOptions = isProduction ? undefined : getDevHttpsOptions();

  return {
    entry: {
      taskpane: "./src/taskpane/taskpane.tsx"
    },
    output: {
      clean: true,
      filename: isProduction ? "assets/[name].[contenthash].js" : "assets/[name].js",
      path: path.resolve(__dirname, "dist"),
      publicPath: `${assetUrl}/`
    },
    devtool: isProduction ? "source-map" : "eval-source-map",
    resolve: {
      extensions: [".tsx", ".ts", ".js"]
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"]
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: "taskpane.html",
        template: "./src/taskpane/taskpane.html",
        chunks: ["taskpane"],
        templateParameters: {
          assetUrl
        }
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "manifest.xml",
            to: "manifest.xml",
            transform(content) {
              let manifest = content.toString().replaceAll("__ASSET_URL__", assetUrl);
              if (isProduction) {
                manifest = manifest.replace(/\s*<AppDomain>https:\/\/localhost:4000<\/AppDomain>/, "");
              }
              return manifest;
            }
          },
          {
            from: "assets",
            to: "assets",
            noErrorOnMissing: true
          }
        ]
      })
    ],
    performance: {
      maxAssetSize: 512000,
      maxEntrypointSize: 512000
    },
    devServer: {
      allowedHosts: "all",
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      historyApiFallback: true,
      hot: true,
      port: 4000,
      server: {
        type: "https",
        options: httpsOptions
      },
      static: {
        directory: path.join(__dirname, "dist")
      }
    }
  };
};

function getDevHttpsOptions() {
  const certRoot = path.join(process.env.USERPROFILE || process.env.HOME || "", ".office-addin-dev-certs");
  const keyPath = path.join(certRoot, "localhost.key");
  const certPath = path.join(certRoot, "localhost.crt");
  const caPath = path.join(certRoot, "ca.crt");

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath) || !fs.existsSync(caPath)) {
    throw new Error("Office Add-in dev certificates are missing. Run `npm run certs:install`, then retry.");
  }

  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
    ca: fs.readFileSync(caPath)
  };
}
