const expect = require("chai").expect;
const sinon = require("sinon");

const Plugins = require("eslint/lib/config/plugins");
const ModuleResolver = require("eslint/lib/util/module-resolver");
const eslintPatch = require("../lib/eslint-patch");

describe("eslint-patch", function() {
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

  describe("Plugins.loadAll", function() {
    before(function() {
      eslintPatch();
    });

    it("delegates each plugin to be loaded", function () {
      Plugins.getAll = sinon.stub().returns([]);
      Plugins.load = sinon.spy();

      Plugins.loadAll([ "jasmine", "mocha"  ]);

      expect(Plugins.load.calledWith("jasmine")).to.be.true;
      expect(Plugins.load.calledWith("mocha")).to.be.true;
    });

    it("only load plugins once", function () {
      Plugins.getAll = sinon.stub().returns([ "node" ]);
      Plugins.load = sinon.spy();

      Plugins.loadAll([ "node" ]);

      expect(Plugins.load.called).to.be.false;
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

  describe("Avoid error processing plugin loading from extends configuration", function() {
    it("patches module resolver", function() {
      const resolve = ModuleResolver.prototype.resolve;

      eslintPatch();
      expect(ModuleResolver.prototype.resolve).to.not.eql(resolve);
    });

    it("returns an empty plugin config instead of error", function() {
      eslintPatch();
      expect(new ModuleResolver().resolve('invalid-plugin')).to.match(/.+empty-plugin.js/);
    });
  });

});
