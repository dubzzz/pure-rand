#!/bin/sh
last_tag=$(git describe --tags --abbrev=0 origin/main)
git log --oneline "${last_tag}..origin/main"
