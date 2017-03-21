const expect = require("chai").expect;
const sinon = require("sinon");

const Plugins = require("eslint/lib/config/plugins");
const ModuleResolver = require("eslint/lib/util/module-resolver");
const eslintPatch = require("../lib/eslint-patch");

describe("eslint-patch", function() {
  describe("patch", function() {
    let loadAll;

    before(function() {
      loadAll = Plugins.loadAll;
    });

    after(function() {
      Plugins.loadAll = loadAll;
    });

    it("intercepts plugins", function() {
      eslintPatch();
      expect(loadAll).to.not.equal(Plugins.loadAll, "Plugins.loadAll is not patched");
    });
  });

  describe("Plugins.loadAll", function() {
    before(function() {
      eslintPatch();
    });

    it("delegates each plugin to be loaded", function () {
      Plugins.load = sinon.spy();

      Plugins.loadAll([ "jasmine", "mocha"  ]);

      expect(Plugins.load.calledWith("jasmine")).to.be.true;
      expect(Plugins.load.calledWith("mocha")).to.be.true;
    });

    it("only warns not supported once", function () {
      console.error = sinon.spy();
      Plugins.load = sinon.stub().throws();

      Plugins.loadAll([ "node" ]);
      Plugins.loadAll([ "node" ]);

      sinon.assert.calledOnce(console.error);
      sinon.assert.calledWith(console.error, "Module not supported: eslint-plugin-node");
    });

    it("does not raise exception for unsupported plugins", function() {
      Plugins.getAll = sinon.stub().returns([]);
      Plugins.load = sinon.stub().throws();

      function loadPlugin() {
        Plugins.loadAll([ "unsupported-plugin" ]);
      }

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
      Plugins.loadAll(['invalidplugin']);
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
