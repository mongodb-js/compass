#!/bin/bash

packages=$(npm ls --json | jq -r '.. | .dependencies? | keys? // [] | .[]' | sort -u)
current_year=$(date +"%Y")

for package in $packages; do
    info=$(npm view $package --json)
    latest_version_tag=$(echo $info | jq -r '.["dist-tags"].latest')

    if [ -n "$latest_version_tag" ]; then
        publish_date=$(echo $info | jq -r --arg version "$latest_version_tag" '.time[$version]' | cut -d '-' -f 1)

        if [ -n "$publish_date" ]; then
            years_difference=$((current_year - publish_date))
            echo "\"${package}\",\"${publish_date}\""
        fi
    fi
done
