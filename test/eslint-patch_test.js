const expect = require("chai").expect;
const sinon = require("sinon");
const eslint = require("eslint");

const Plugins = require("eslint/lib/config/plugins");
const patch = require("../lib/eslint-patch");

describe("eslint-patch", function() {
  let loadAll;

  before(function() {
    loadAll = Plugins.loadAll;
    patch(eslint);
  });

  after(function() {
    Plugins.loadAll = loadAll;
  });

  it("intercept plugins", function() {
    expect(loadAll).to.not.equal(Plugins.loadAll, "Plugins.loadAll is not patched");
  });

  describe("Plugins.loadAll", function() {
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

});
