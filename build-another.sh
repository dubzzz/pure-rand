# Forbidden if something has not been commited
if ! git diff-index --quiet HEAD --; then
    echo "Please commit your local changes!"
    exit 1
fi

# Extract details concerning the current environnment
rawCurrentBranch="$(git branch | grep "*")"
currentBranch="$(expr substr "${rawCurrentBranch}" 3 1000)"

# Move to commit and build it
commitId=$1
if [ -z "$commitId" ]
then
    echo "Please provide a commit id!"
    exit 1
fi
target=$2
if [ -z "$target" ]
    target="es6"
fi
git checkout "${commitId}"
yarn
./node_modules/typescript/bin/tsc --target "${target}" --outDir "lib-${commitId}/"

# Move back to original location
git checkout "${currentBranch}"