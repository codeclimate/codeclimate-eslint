const expect = require("chai").expect;
const sinon = require("sinon");

const Plugins = require("eslint/lib/config/plugins");
const ModuleResolver = require("eslint/lib/util/module-resolver");
const eslintPatch = require("../lib/eslint-patch");

describe("eslint-patch", function() {
  describe("patch", function() {
    let loadAll;

    before(function() {
      loadAll = Plugins.prototype.loadAll;
    });

    after(function() {
      Plugins.prototype.loadAll = loadAll;
    });

    it("intercepts plugins", function() {
      eslintPatch();
      expect(loadAll).to.not.equal(Plugins.prototype.loadAll, "Plugins.loadAll is not patched");
    });
  });

  describe("Plugins.loadAll", function() {
    before(function() {
      eslintPatch();
    });

    it("delegates each plugin to be loaded", function () {
      let plugins = new Plugins();
      plugins.load = sinon.spy();

      plugins.loadAll([ "jasmine", "mocha"  ]);

      expect(plugins.load.calledWith("jasmine")).to.be.true;
      expect(plugins.load.calledWith("mocha")).to.be.true;
    });

    it("only warns not supported once", function () {
      console.error = sinon.spy();
      let plugins = new Plugins();
      plugins.load = sinon.stub().throws(new Error("Failed to load plugin eslint-plugin-node"));

      plugins.loadAll([ "node" ]);
      plugins.loadAll([ "node" ]);

      sinon.assert.calledOnce(console.error);
      sinon.assert.calledWith(console.error, "Module not supported: eslint-plugin-node");
    });

    it("does not raise exception for unsupported plugins", function() {
      let plugins = new Plugins();
      plugins.getAll = sinon.stub().returns([]);
      plugins.load = sinon.stub().throws(new Error("Failed to load plugin eslint-plugin-unsupported-plugin"));

      function loadPlugin() {
        plugins.loadAll([ "unsupported-plugin" ]);
      }

      loadPlugin();
      expect(loadPlugin).to.not.throw();
    });
  });

  describe("loading extends configuration", function() {
    it("patches module resolver", function() {
      const resolve = ModuleResolver.prototype.resolve;

      eslintPatch();
      expect(ModuleResolver.prototype.resolve).to.not.eql(resolve);
    });

    it("returns fake config for skipped modules", function() {
      eslintPatch();
      let plugins = new Plugins();
      plugins.loadAll(['invalidplugin']);
      expect(new ModuleResolver().resolve('eslint-plugin-invalidplugin')).to.match(/.+empty-plugin.js/);
    });

    it("does not warn user repeatedly about not supported modules", function() {
      console.error = sinon.spy();
      eslintPatch();

      for(var i=0; i<3; i++) {
        new ModuleResolver().resolve('eslint-plugin-bogus');
      }

      expect(console.error.callCount).to.eql(1);
    });
  });

});
