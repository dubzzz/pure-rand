#!/bin/sh

# Last breaking version of TypeScript
rm -rfv lib/ts3.2
mv lib/types lib/ts3.2

# Before 3.2
cp -R lib/ts3.2 lib/types
find ./lib/types -type f -exec sed -i 's/bigint/any/g' {} \;
