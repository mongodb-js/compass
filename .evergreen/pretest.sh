#! /usr/bin/env bash

if [[ $OSTYPE == "cygwin" ]]; then
    export PLATFORM='win32'
    export IS_WINDOWS=true
elif [[ `uname` == Darwin ]]; then
    export PLATFORM='darwin'
    export IS_OSX=true
else
    export PLATFORM='linux'
    export IS_LINUX=true
    if [[ `cat /etc/*release | grep ^NAME | grep Red` ]]; then
        export IS_RHEL=true
    elif [[ `cat /etc/*release | grep ^NAME | grep Ubuntu` ]]; then
        export IS_UBUNTU=true
    fi
fi

if [ -n "$IS_UBUNTU" ]; then
    if [ -n "$IS_UBUNTU" ]; then
        sudo apt-get install -y gnome-keyring python-gnomekeyring
        sudo cp .evergreen/xvfb-service.sh /etc/init.d/xvfb;
        sudo chmod +x /etc/init.d/xvfb;
    fi
    
    export NO_AT_BRIDGE=1
    export DISPLAY=:99.0; 
    sudo sh -e /etc/init.d/xvfb start;
    sleep 3;

    eval $(dbus-launch --sh-syntax);
    eval $(echo -n "" | /usr/bin/gnome-keyring-daemon --login);
    eval $(/usr/bin/gnome-keyring-daemon --components=secrets --start);
    /usr/bin/python -c "import gnomekeyring;gnomekeyring.create_sync('login', '');";
fi