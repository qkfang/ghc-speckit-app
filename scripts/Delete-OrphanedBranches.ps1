#!/usr/bin/env pwsh
# Delete local branches that no longer exist on remote
git fetch --prune
git branch -vv | Select-String ': gone]' | ForEach-Object { $_.ToString().Trim().Split()[0] } | ForEach-Object { git branch -D $_ }
