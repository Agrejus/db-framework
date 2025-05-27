import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@rspack/cli";
import { ProvidePlugin } from "@rspack/core";

// import { createRequire } from "node:module";
// const require = createRequire(import.meta.url);

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    entry: "./src/index.ts", // Entry point for your library
    output: {
        path: resolve(__dirname, "dist"),
        filename: "index.js", // Default output file name
        library: {
            type: "module"
        },
        globalObject: "this", // Ensures compatibility with both browser and Node.js
        clean: true, // Cleans the output directory before each build
    },
    experiments: {
        outputModule: true
    },
    module: {
        rules: [
            {
                test: /\.ts$/, // Match TypeScript files
                use: {
                    loader: "ts-loader",
                    options: {
                        transpileOnly: false, // Ensure type-checking is performed
                    },
                },
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".js"],
        fallback: {
            "perf_hooks": false,
            // "buffer": require.resolve("buffer/"),
            // "process": require.resolve("process/browser"),
            // "stream": require.resolve("stream-browserify"),
            // "util": require.resolve("util/"),
            // "events": require.resolve("events/"),
            // add more as needed if you see errors
        }
    },
    plugins: [
        // new ProvidePlugin({
        //     Buffer: ["buffer", "Buffer"],
        //     process: ["process"],
        // }),
    ],
    target: "web", // Compile for both browser and Node.js
    mode: "development", // Set production mode
    devtool: "source-map"
});
