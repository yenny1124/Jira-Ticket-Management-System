// Helper function to extract LS Customer (4th item in Linked Service Requests) from an HTML string
const extractLSCustomer = (htmlString) => {
    // Split the string by the separator, in this case, " - "
    const items = htmlString.split(' - ');
    
    // Check if there are at least 4 items
    if (items.length >= 4) {
        // Return the 4th item
        return items[3].trim();
    }
    
    // Return an empty string if there are less than 4 items
    return '';
};

// Mock test cases
const testCases = [
    {
        input: "01625829 - Normal - Normal - Microsoft Corporation - Richardson - US - Kha Doan\n ",
        expected: "Microsoft Corporation"
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
    const result = extractLSCustomer(testCase.input);
    const passed = result === testCase.expected;
    console.log(`Test Case ${index + 1}: ${passed ? 'Passed' : 'Failed'}`);
    console.log(`    Input: ${testCase.input}`);
    console.log(`    Expected: ${testCase.expected}`);
    console.log(`    Got: ${result}`);
});