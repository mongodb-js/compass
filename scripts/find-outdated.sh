#!/bin/bash

# Threshold for determining if a package is outdated (in years)
years_threshold=5 # Change this to the desired number of years

# Extract unique package names
packages=$(npm ls --json | jq -r '.. | .dependencies? | keys? // [] | .[]' | sort -u)

# Current year for comparison
current_year=$(date +"%Y")

# Iterate over packages
for package in $packages; do
    # Get package info including dist-tags
    info=$(npm view $package --json)

    # Extract the latest version number
    latest_version_tag=$(echo $info | jq -r '.["dist-tags"].latest')

    # Extract the publish date of the latest version
    if [ -n "$latest_version_tag" ]; then
        publish_date=$(echo $info | jq -r --arg version "$latest_version_tag" '.time[$version]' | cut -d '-' -f 1)

        if [ -n "$publish_date" ]; then
            # Calculate the difference in years
            years_difference=$((current_year - publish_date))

            # Check if the latest version was published more than the threshold years ago

            echo "\"${package}\",\"${publish_date}\""
            # if [ "$years_difference" -ge "$years_threshold" ]; then

            # else
            #   echo "$package OK ($years_difference years) $publish_date"
            # fi
            # else
            #     # echo "Publish date not available for the latest version of package: $package"
        fi
    else
        echo "Latest version tag not available for package: $package"
    fi
done
