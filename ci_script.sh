#!/usr/bin/env bash
set -e # halt script on error

for file in topics/*.md 
do
    awesome_bot $file --allow-redirect --set-timeout 10
done