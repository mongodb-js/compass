#!/bin/bash

OS=$(uname -s)

setup_darwin_environment() {
    if ! command -v brew &> /dev/null; then
        echo "Homebrew is not installed. Installing ..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
        echo "Homebrew installed successfully."
    else
        echo "Homebrew is already installed."
    fi

    if ! command -v atlas &> /dev/null; then
        echo "Atlas CLI is not installed. Installing using Homebrew..."
        brew install mongodb-atlas-cli
        echo "Atlas CLI installed successfully."
    else
        echo "Atlas CLI is already installed."
    fi
}

# Usage information
if [ $# -eq 0 ] ; then
    echo "Usage"
    echo "  atlascli.sh setup [PORT] [NAME]"
    echo "  atlascli.sh teardown [NAME]"
    exit 0
fi

# The setup command
if [ "$1" = "setup" ]; then

    if [ -z "$2" ] || [ -z "$3" ]; then
        echo "Usage"
        echo "  atlascli.sh setup [PORT] [NAME]"
        exit 0
    fi

    if [ "$OS" = "Darwin" ]; then
        setup_darwin_environment

        PORT=$2
        NAME=$3

        echo "Setting up a local deployment $NAME on port $PORT"
        atlas deployments setup $NAME --force --type LOCAL --port $PORT
        exit 0
    else
        echo "Skipping atlascli setup for: $OS"
        exit 1
    fi
fi

# The teardown command
if [ "$1" = "teardown" ]; then
    if [ -z "$2" ]; then
        echo "Usage"
        echo "  atlascli.sh teardown [NAME]"
        exit 0
    fi
    if [ "$OS" = "Darwin" ]; then
        NAME=$2
        echo "Tearing down a local deployment $NAME"
        atlas deployments delete $NAME --force
        exit 0
    else
        echo "Skipping atlascli teardown for: $OS"
        exit 1
    fi
fi
