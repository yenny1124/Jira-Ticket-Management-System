// Function to extract SR number from HTML string
const extractSRNumber = (htmlString) => {
    const match = htmlString.match(/>(\d+)</);
    return match ? match[1] : '';
};

// Mock test cases
const testCases = [
    {
        input: '<a target=_sf_jira href="https://spirent--sftestfull.sandbox.lightning.force.com/_ui/search/ui/UnifiedSearchResults?asPhrase=1&searchType=2#!/fen=500&initialViewMode=detail&str=01625829">01625829</a>',
        expected: '01625829'
    },
    {
        input: '<a href="https://example.com">12345678</a>',
        expected: '12345678'
    },
    {
        input: '<a>Test String</a>',
        expected: ''
    },
    {
        input: 'No HTML here',
        expected: ''
    },
    {
        input: '<span>Just a span</span>',
        expected: ''
    }
];

// Run test cases
testCases.forEach((testCase, index) => {
    const result = extractSRNumber(testCase.input);
    const passed = result === testCase.expected;
    console.log(`Test Case ${index + 1}: ${passed ? 'Passed' : 'Failed'}`);
    console.log(`    Input: ${testCase.input}`);
    console.log(`    Expected: ${testCase.expected}`);
    console.log(`    Got: ${result}`);
});
