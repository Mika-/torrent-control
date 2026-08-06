/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

var path = require("path");
var utils = require("../utils");
var chai = require("chai");
var expect = chai.expect;
var exec = utils.exec;
var isWindows = /^win/.test(process.platform);
var run = require("../../lib/run");
var parse = require("shell-quote").parse;

var fakeBinary = path.join(__dirname, "..", "utils", "dummybinary" +
  (isWindows ? ".bat" : ".sh"));

const ENV = {
  env: {
    TESTING_FX_RUNNER: true
  }
};

describe("fx-runner start", function () {
  describe("-b/--binary <FAKE_BINARY>", function () {
    it("-p <name>", function (done) {
      var proc = exec("start -v -b " + fakeBinary + " -p foo", ENV, function (err, stdout, stderr) {
        expect(err).to.not.be.ok;
        expect(stderr).to.not.be.ok;
        expect(JSON.parse(stdout)).to.contain({
          binary: fakeBinary,
          profile: "foo",
          "new-instance": false,
          "foreground": false,
          "no-remote": false,
          "binary-args": "",
          "listen": 6000
        });
        done();
      });
    });

    it("-p <path>", function (done) {
      var proc = exec("start -v -b " + fakeBinary + " -p ./", ENV, function (err, stdout, stderr) {
        expect(err).to.not.be.ok;
        expect(stderr).to.not.be.ok;

        expect(JSON.parse(stdout)).to.contain({
          binary: fakeBinary,
          profile: "./",
          "new-instance": false,
          "foreground": false,
          "no-remote": false,
          "binary-args": "",
          "listen": 6000
        });

        done();
      });
    });

    it("--binary-args <CMDARGS>", function (done) {
      var proc = exec("start -v -b " + fakeBinary + " --binary-args \"-test\" ./", ENV, function (err, stdout, stderr) {
        expect(err).to.not.be.ok;
        expect(stderr).to.not.be.ok;

        expect(JSON.parse(stdout)).to.contain({
          binary: fakeBinary,
          "new-instance": false,
          "foreground": false,
          "no-remote": false,
          "binary-args": "-test",
          "listen": 6000
        });
        done();
      });
    });

    it("--foreground", function (done) {
      var proc = exec("start -v -b " + fakeBinary + " --foreground", ENV, function (err, stdout, stderr) {
        expect(err).to.not.be.ok;
        expect(stderr).to.not.be.ok;
        expect(JSON.parse(stdout)).to.contain({
          binary: fakeBinary,
          "new-instance": false,
          "foreground": true,
          "no-remote": false,
          "binary-args": "",
          "listen": 6000
        });
        done();
      });
    });

    it("--no-remote", function (done) {
      var proc = exec("start -v -b " + fakeBinary + " --no-remote", ENV, function (err, stdout, stderr) {
        expect(err).to.not.be.ok;
        expect(stderr).to.not.be.ok;
        expect(JSON.parse(stdout)).to.contain({
          binary: fakeBinary,
          "new-instance": false,
          "foreground": false,
          "no-remote": true,
          "binary-args": "",
          "listen": 6000
        });
        done();
      });
    });

    it("--new-instance", function (done) {
      var proc = exec("start -v -b " + fakeBinary + " --new-instance", ENV, function (err, stdout, stderr) {
        expect(err).to.not.be.ok;
        expect(stderr).to.not.be.ok;
        expect(JSON.parse(stdout)).to.contain({
          binary: fakeBinary,
          "new-instance": true,
          "foreground": false,
          "no-remote": false,
          "binary-args": "",
          "listen": 6000
        });
        done();
      });
    });

    it("--listen", function (done) {
      var proc = exec("start -v -b " + fakeBinary + " --listen 6666", ENV, function (err, stdout, stderr) {
        expect(err).to.not.be.ok;
        expect(stderr).to.not.be.ok;
        expect(JSON.parse(stdout)).to.contain({
          binary: fakeBinary,
          "new-instance": false,
          "foreground": false,
          "no-remote": false,
          "binary-args": "",
          "listen": 6666
        });
        done();
      });
    });
  });
});

describe("concat binary arguments", function () {
  it("concats binary arguments from a string", function () {
    var arr = parse("-a b -c \"d e\"");
    expect(arr[0]).to.be.equal("-a");
    expect(arr[1]).to.be.equal("b");
    expect(arr[2]).to.be.equal("-c");
    expect(arr[3]).to.be.equal("d e");
  });
});

describe("buildArgs", () => {
  it("returns a list of arguments", () => {
    const options = {
      foreground: true,
      'binary-args': ["-a", 1, "-b", "--long-flag"],
    };
    expect(run.buildArgs(options)).to.be.eql([
      "-foreground",
      "-a",
      1,
      "-b",
      "--long-flag",
    ]);
  });

  it("puts the binary args first when `binary-args-first` is `true`", () => {
    const options = {
      foreground: true,
      'binary-args': ["run", "app", "--long-flag"],
      'binary-args-first': true,
    };
    expect(run.buildArgs(options)).to.be.eql([
      "run",
      "app",
      "--long-flag",
      "-foreground",
    ]);
  });

});
