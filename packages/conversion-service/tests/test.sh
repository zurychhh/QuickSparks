#!/bin/bash

# Simple script to verify our test files
echo "Testing utils.test.ts"
node --require ts-node/register ./utils/utils.test.ts

echo "All tests completed!"