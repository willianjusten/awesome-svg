#!/usr/bin/env bash
set -e # halt script on error

for file in topics/*.md
do
    bundle exec awesome_bot $file --allow-redirect --allow-ssl --set-timeout 10 --white-list slideshare,angrytools,css-tricks,livrosvg,kartikprabhu
done
