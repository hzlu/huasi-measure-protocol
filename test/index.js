'use strict';
var expect = require('chai').expect;
var { TxtCommandCreator } = require('../dist/index.js');

describe('TxtCommandCreator class test', () => {
    it('should return GET DATA command', () => {
        var result = new TxtCommandCreator('280537').create('GET_DATA');
        expect(result.toString()).to.contain('GET,DATA');
    });
});
