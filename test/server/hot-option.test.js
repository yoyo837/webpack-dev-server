"use strict";

const webpack = require("webpack");
const request = require("supertest");
const Server = require("../../lib/Server");
const config = require("../fixtures/client-config/webpack.config");
const multiCompilerConfig = require("../fixtures/multi-compiler-config/webpack.config");
const port = require("../ports-map")["hot-option"];

describe("hot option", () => {
  let server;
  let req;

  describe("simple hot config entries", () => {
    beforeAll(async () => {
      const compiler = webpack(config);

      server = new Server({ port }, compiler);

      await server.start();

      req = request(server.app);
    });

    afterAll(async () => {
      await server.stop();
    });

    it("should include hot script in the bundle", async () => {
      const response = await req.get("/main.js");

      expect(response.status).toEqual(200);
      expect(response.text).toContain("webpack/hot/dev-server.js");
    });
  });

  describe("simple hot-only config entries", () => {
    beforeAll(async () => {
      const compiler = webpack(config);

      server = new Server(
        {
          port,
          hot: "only",
        },
        compiler
      );

      await server.start();

      req = request(server.app);
    });

    afterAll(async () => {
      await server.stop();
    });

    it("should include hot-only script in the bundle", async () => {
      const response = await req.get("/main.js");

      expect(response.status).toEqual(200);
      expect(response.text).toContain("webpack/hot/only-dev-server.js");
    });
  });

  describe("multi compiler hot config entries", () => {
    beforeAll(async () => {
      const compiler = webpack(multiCompilerConfig);

      server = new Server({ port }, compiler);

      await server.start();

      req = request(server.app);
    });

    afterAll(async () => {
      await server.stop();
    });

    it("should include hot script in the bundle", async () => {
      const response = await req.get("/main.js");

      expect(response.status).toEqual(200);
      expect(response.text).toContain("webpack/hot/dev-server.js");
    });
  });

  describe("hot disabled entries", () => {
    beforeAll(async () => {
      const compiler = webpack(multiCompilerConfig);

      server = new Server({ port, hot: false }, compiler);

      await server.start();

      req = request(server.app);
    });

    afterAll(async () => {
      await server.stop();
    });

    it("should NOT include hot script in the bundle", async () => {
      const response = await req.get("/main.js");

      expect(response.status).toEqual(200);
      expect(response.text).not.toMatch(/webpack\/hot\/dev-server\.js/);
    });
  });

  // the following cases check to make sure that the HMR
  // plugin is actually added

  describe("simple hot config HMR plugin", () => {
    it("should register the HMR plugin before compilation is complete", async () => {
      let pluginFound = false;
      const compiler = webpack(config);

      compiler.hooks.compilation.intercept({
        register: (tapInfo) => {
          if (tapInfo.name === "HotModuleReplacementPlugin") {
            pluginFound = true;
          }

          return tapInfo;
        },
      });

      server = new Server({ port }, compiler);

      await server.start();

      expect(pluginFound).toBe(true);

      await server.stop();
    });
  });

  describe("multi compiler hot config HMR plugin", () => {
    it("should register the HMR plugin before compilation is complete", async () => {
      let pluginFound = false;
      const compiler = webpack(multiCompilerConfig);

      compiler.compilers[0].hooks.compilation.intercept({
        register: (tapInfo) => {
          if (tapInfo.name === "HotModuleReplacementPlugin") {
            pluginFound = true;
          }

          return tapInfo;
        },
      });

      server = new Server({ port }, compiler);

      await server.start();

      expect(pluginFound).toBe(true);

      await server.stop();
    });
  });

  describe("hot disabled HMR plugin", () => {
    it("should NOT register the HMR plugin before compilation is complete", async () => {
      let pluginFound = false;
      const compiler = webpack(config);

      compiler.hooks.compilation.intercept({
        register: (tapInfo) => {
          if (tapInfo.name === "HotModuleReplacementPlugin") {
            pluginFound = true;
          }

          return tapInfo;
        },
      });

      server = new Server({ port, hot: false }, compiler);

      await server.start();

      expect(pluginFound).toBe(false);

      await server.stop();
    });
  });
});
