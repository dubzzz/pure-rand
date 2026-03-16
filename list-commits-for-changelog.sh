#!/bin/sh
last_tag=$(git describe --tags --abbrev=0 main)
git log --oneline "${last_tag}..main"
