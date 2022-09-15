import {getHostFilter} from '../../src/lib/baseclient.js';

describe('BaseClient', () => {
    it('Test getHostFilter', () => {
        const testCases = [
            {
                hostname: 'http://example.com/',
                result: 'http://example.com/*',
            },
            {
                hostname: 'https://example.com/',
                result: 'https://example.com/*',
            },
            {
                hostname: 'https://example.com:8080/webui',
                result: 'https://example.com/*',
            },
            {
                hostname: 'https://long.sub.domain.example.com/',
                result: 'https://long.sub.domain.example.com/*',
            },
            {
                hostname: 'https://user:pass@example.com:9000',
                result: 'https://example.com/*',
            },
            {
                hostname: 'https://127.0.0.1:8080/',
                result: 'https://127.0.0.1/*',
            },
            {
                hostname: 'https://[2001:0db8:0000:0000:0000:0000:1420:57ab]:8080/webui',
                result: 'https://[2001:db8::1420:57ab]/*',
            },
        ];

        testCases.forEach((testCase) => {
            expect(getHostFilter(testCase.hostname)).to.equal(testCase.result)
        });
    })
})
