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

if [ -n "$IS_LINUX" ]; then
    if [ -n "$IS_UBUNTU" ]; then
        sudo apt-get install -y gnome-keyring
    else
        yum localinstall -y http://mirror.centos.org/centos/7/os/x86_64/Packages/gnome-keyring-3.28.2-1.el7.x86_64.rpm
        yum localinstall -y http://dl.fedoraproject.org/pub/epel/7/x86_64/Packages/p/python2-keyring-5.0-3.el7.noarch.rpm
    fi

    sudo cp .evergreen/xvfb-service.sh /etc/init.d/xvfb;
    sudo chmod +x /etc/init.d/xvfb;

    export NO_AT_BRIDGE=1
    export DISPLAY=:99.0; 
    sudo sh -e /etc/init.d/xvfb start;
    sleep 3;

    # Some arcane hack to fix keyring issue, no idea if that's even doing
    # something
    # https://github.com/atom/node-keytar/issues/132#issuecomment-444159414
    eval $(dbus-launch --sh-syntax);
    eval $(echo -n "" | /usr/bin/gnome-keyring-daemon --login);
    eval $(/usr/bin/gnome-keyring-daemon --components=secrets --start);
    if [ -n "$IS_UBUNTU" ]; then
        # TODO: There is no gnomekeyring available on ubuntu20, let's hope this
        # ancient hack is not needed anymore
        echo "Skipping python-gnomekeyring call"
    else
        /usr/bin/python -c "import gnomekeyring;gnomekeyring.create_sync('login', '');";
    fi
fi